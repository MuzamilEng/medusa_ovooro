const express = require('express');
const axios = require('axios');
const { Client } = require('pg');

const app = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = new Client({
    connectionString: "postgresql://tcfxxx54asdalk:PaDGBC6CKF8J9lEKHWf3Cga8p9f9Hs3WYAnxZY26hex27lprG7kRpQ@db1.sigma.thechristmasfabric.com:49327/tcf_live?sslmode=require",
//   connectionString: "postgresql://admin:root@localhost:5432/medusa_ovooro4",
});
client.connect();



async function downloadImage(url) {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer'
    });
    return response.data;
  }
  
  
  const getProduct = async (req, res) => {
    try {
        let existingMetadata =  [];
      // Step 1: Fetch all products
      const { data: productsList } = await axios.get('https://st1.thechristmasfabric.com/wp-json/wc/v3/products', {
        auth: {
          username: 'ck_f4a7cd7496a19b99add6313d4eb08c98e1591cad',
          password: 'cs_638a72503ca80b8b06050f6f0840f64d9a9e0c8d',
        },
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        params: {
          per_page: 100,
          page: 2
        }
      });
      function generateRandomId(prefix = 'prod_') {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = prefix;
        for (let i = 0; i < 10; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
      }
  
      for (const product of productsList) {
        // Fetch product details and variants
        const { data: productDetails } = await axios.get(`https://st1.thechristmasfabric.com/wp-json/wc/v3/products/${product.id}`, {
          auth: {
            username: 'ck_f4a7cd7496a19b99add6313d4eb08c98e1591cad',
            password: 'cs_638a72503ca80b8b06050f6f0840f64d9a9e0c8d',
          },
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
  
        const { data: variants } = await axios.get(`https://st1.thechristmasfabric.com/wp-json/wc/v3/products/${product.id}/variations`, {
          auth: {
            username: 'ck_f4a7cd7496a19b99add6313d4eb08c98e1591cad',
            password: 'cs_638a72503ca80b8b06050f6f0840f64d9a9e0c8d',
          },
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
  
        const productId = generateRandomId('prod_');
  
  
  
  
        // Check if the product slug already exists in existingMetadata
        if (existingMetadata.includes(productDetails.slug)) {
            console.log(`Product with slug ${productDetails.slug} already exists. Skipping.`);
            continue; // Skip this product
          }
    
        
        // Insert product into database (if not already exists)
        const checkExistingProductQuery = `SELECT * FROM public.product WHERE handle = $1`;
        const { rows } = await client.query(checkExistingProductQuery, [productDetails.slug]);
  
        if (rows.length === 0) {
        //  table data for size guide 
        // Step 1: Extract and insert the table ids from the product's meta_data
        const metaData = productDetails.meta_data;
  
        // Step 2: Filter the meta_data entries where the key includes '_wpt_field_wpt'
        const relevantMetaData = metaData.filter(meta => meta.key.includes('_wpt_field_wpt'));
        
        // Step 3: Define a regular expression to extract table IDs from the value strings
        const tableIdRegex = /\[table id=([a-zA-Z0-9\-]+)[^\]]*\]/g;
        
        let tableIds = [];
        
        // Step 4: Extract table IDs from the relevant meta_data values
        relevantMetaData.forEach(meta => {
          let match;
          while ((match = tableIdRegex.exec(meta.value)) !== null) {
            // match[1] contains the table id (e.g., sgcp-128-baby-en)
            tableIds.push(match[1].trim());
          }
        });
         console.log(tableIds, "---------------------, tableIds");
         
        // Step 5: Prepare the query to insert the table data into the database
        const tableInsertQuery = 
          `INSERT INTO public.product_tables (product_id, table_id, table_data)
          VALUES ($1, $2, $3)`
        ;
        
        // Step 6: Match the extracted table IDs with the entries in the tableData JSON and insert
        for (const tableId of tableIds) {
          // Loop through the keys in the tableData JSON to find a matching id
          let matchingTableKey = null;
        
          Object.keys(tableData).forEach((jsonKey) => {
            const tableEntry = tableData[jsonKey];
            if (tableEntry.id === tableId) {
              matchingTableKey = jsonKey;
            }
          });
        
          if (matchingTableKey) {
            console.log(`Table data found for tableId: ${tableId}`);
            
            const table = tableData[matchingTableKey]; // Now match based on the nested id
            // Insert the table data into the database
            await client.query(tableInsertQuery, [productId, "tbl_" + tableId, JSON.stringify(table)]);
          } else {
            console.warn(`Table data not found for tableId: ${tableId}`);
          }
        }
  
        // include tranlations 
        const meta_data = {};

        // Iterate over the translations object in productDetails
        const translations = productDetails.translations;
        meta_data['short_description'] = productDetails.short_description;

        if (translations) {
          for (const [lang, translationProductId] of Object.entries(translations)) {
            // Fetch product details for each translation
            const { data: translatedProduct } = await axios.get(`https://st1.thechristmasfabric.com/wp-json/wc/v3/products/${translationProductId}`, {
              auth: {
                username: 'ck_f4a7cd7496a19b99add6313d4eb08c98e1591cad',
                password: 'cs_638a72503ca80b8b06050f6f0840f64d9a9e0c8d',
              },
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            });

            // Dynamically add translation data to meta_data with language suffixes
            meta_data[`${lang}_description`] = translatedProduct.description || '';
            meta_data[`${lang}_short_description`] = translatedProduct.short_description || '';
            meta_data[`${lang}_handle`] = translatedProduct.slug || '';
            meta_data[`${lang}_title`] = translatedProduct.name || '';

            // push these in existingMetadata array
            existingMetadata.push(translatedProduct.slug)
          }
        }
  
        console.log(meta_data, "Updated Meta Data with Translations");
  
  
  
  
          const productQuery = 
            `INSERT INTO public.product (id, title, description, handle, weight, length, height, width, thumbnail, short_description, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`
          ;
          await client.query(productQuery, [
            productId, productDetails.name || '', productDetails.description || '', productDetails.slug || '',
            parseInt(productDetails.weight) || 0, parseInt(productDetails.dimensions.length) || 0,
            parseInt(productDetails.dimensions.height) || 0, parseInt(productDetails.dimensions.width) || 0,
            productDetails.images[0]?.src || '', productDetails.short_description || '' , JSON.stringify(meta_data)
          ]);
  
  
            // Insert related products
            const relatedProductQuery = 
           ` INSERT INTO public.product_category (id, name, handle, related_id)
            VALUES ($1, $2, $3, $4)`
            ;
            
            for (const id of productDetails.related_ids) {
            const { data: relatedProduct } = await axios.get(`https://st1.thechristmasfabric.com/wp-json/wc/v3/products/${id}`, {
              auth: {
                username: 'ck_f4a7cd7496a19b99add6313d4eb08c98e1591cad',
                password: 'cs_638a72503ca80b8b06050f6f0840f64d9a9e0c8d',
              },
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            });
            const relatedId = generateRandomId('cat_');
            await client.query(relatedProductQuery, [
              relatedId, relatedProduct.name, productId+'_'+relatedProduct.slug, productId
            ]);
            }
            
              // Download and store images
        // const imageInsertQuery = 
        //   INSERT INTO public.image (id, url, image_data) 
        //   VALUES ($1, $2, $3)
        // ;
  
        // for (const image of productDetails.images) {
        //   const imageId = generateRandomId('Img_');
        //   const imageData = await downloadImage(image.src); // Download the image data as binary
        //   await client.query(imageInsertQuery, [imageId, image.src, imageData]); // Insert image into the DB
          
        //   // Insert into public.product_images table
        //   const productImageInsertQuery = 
        //     INSERT INTO public.product_images (product_id, image_id) 
        //     VALUES ($1, $2)
        //   ;
        //   await client.query(productImageInsertQuery, [productId, imageId]);
        // }
  
          // Loop through variants and insert them along with their options and values
          // for (const variant of variants) {
          //   const variantId = generateRandomId('variant_');
            
          //   // Insert variant into the database
          //   const variantQuery = 
          //     INSERT INTO public.product_variant (id, title, product_id, inventory_quantity)
          //     VALUES ($1, $2, $3, $4)
          //     RETURNING id
          //   ;
          //   const variantResult = await client.query(variantQuery, [variantId, variant.name, productId, variant.stock_quantity || 1000]);
  
          //   // Insert the money amount for this variant
          //   const moneyAmountId = generateRandomId('mon_');
          //   const moneyAmountQuery = 
          //     INSERT INTO public.money_amount (id, currency_code, amount)
          //     VALUES ($1, $2, $3)
          //     RETURNING id
          //   ;
          //   const moneyAmountResult = await client.query(moneyAmountQuery, [moneyAmountId, 'eur', parseInt(variant.price) || 0]);
  
          //   // Link variant to its money amount
          //   const productVariantMoneyAmountId = generateRandomId('pvma_');
          //   const productVariantMoneyAmountQuery = 
          //     INSERT INTO public.product_variant_money_amount (id, money_amount_id, variant_id)
          //     VALUES ($1, $2, $3)
          //   ;
          //   await client.query(productVariantMoneyAmountQuery, [productVariantMoneyAmountId, moneyAmountResult.rows[0].id, variantResult.rows[0].id]);
  
          //   // Loop through product options (attributes)
          //   for (const attribute of productDetails.attributes) {
          //     const optionId = generateRandomId('opt_');
  
          //     // Insert the product option if not already inserted
          //     const optionQuery = 
          //       INSERT INTO public.product_option (id, title, product_id)
          //       VALUES ($1, $2, $3)
          //       RETURNING id
          //     ;
          //     const optionResult = await client.query(optionQuery, [optionId, attribute.name, productId]);
  
          //     // Insert the option values and associate them with the variant
          //     for (const optionValue of attribute.options) {
          //       const optionValueId = generateRandomId('optval_');
                
          //       // Insert option value into the product_option_value table
          //       const optionValueQuery = 
          //         INSERT INTO public.product_option_value (id, value, option_id, variant_id)
          //         VALUES ($1, $2, $3, $4)
          //       ;
          //       await client.query(optionValueQuery, [optionValueId, optionValue, optionResult.rows[0].id, variantResult.rows[0].id]);
          //     }
          //   }
          // }
  
  
             // Insert images
             const imageInsertQuery = 
             `INSERT INTO public.image (id, url) 
             VALUES ($1, $2)`
             ;
             
             for (const image of productDetails.images) {
             const imageId = generateRandomId('Img_');
             await client.query(imageInsertQuery, [imageId, image.src]);
             
             // Insert into public.product_images table
             const productImageInsertQuery = 
              ` INSERT INTO public.product_images (product_id, image_id) 
               VALUES ($1, $2)`
             ;
             await client.query(productImageInsertQuery, [productId, imageId]);
             }
  
          // Loop through variants and insert them along with their options and values
          for (const variant of variants) {
            const variantId = generateRandomId('variant_');
          
            // Check if the variant exists (product_variant) using product_id and variant name
            const checkExistingVariantQuery = 
             ` SELECT * FROM public.product_variant WHERE product_id = $1 AND title = $2`
            ;
            const existingVariant = await client.query(checkExistingVariantQuery, [productId, variant.name]);
          
            // if (existingVariant.rows.length === 0) {
              // Insert new variant (product_variant)
              const variantQuery = 
                `INSERT INTO public.product_variant (id, title, product_id, inventory_quantity, sku)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id`
              ;
              const variantResult = await client.query(variantQuery, [variantId, variant.name, productId, variant.stock_quantity || 1000, variant.sku]);
          
              // Insert price (money_amount and product_variant_money_amount)
              const price = variant.sale_price || variant.price;
              const currencyCode = variant.meta_data.find(meta => meta.key === '_product_base_currency')?.value || 'EUR'; // Extract the currency code
          
              const moneyAmountId = generateRandomId('mon_');
              const moneyAmountQuery = 
                `INSERT INTO public.money_amount (id, currency_code, amount)
                VALUES ($1, $2, $3)
                RETURNING id`
              ;
              const moneyAmountResult = await client.query(moneyAmountQuery, [moneyAmountId, currencyCode.toLowerCase(), parseInt(price) || 0]);
          
              const productVariantMoneyAmountId = generateRandomId('pvma_');
              const productVariantMoneyAmountQuery = 
                `INSERT INTO public.product_variant_money_amount (id, money_amount_id, variant_id)
                VALUES ($1, $2, $3)`
              ;
              await client.query(productVariantMoneyAmountQuery, [productVariantMoneyAmountId, moneyAmountResult.rows[0].id, variantResult.rows[0].id]);
          
              // Insert product options (product_option and product_option_value)
              for (const attribute of variant.attributes) {
                const checkExistingOptionQuery = 
                  `SELECT * FROM public.product_option WHERE product_id = $1 AND title = $2`
                ;
                const existingOption = await client.query(checkExistingOptionQuery, [productId, attribute.name]);
          
                let optionId;
                if (existingOption.rows.length === 0) {
                  const optionInsertId = generateRandomId('opt_');
                  const optionQuery = 
                   ` INSERT INTO public.product_option (id, title, product_id)
                    VALUES ($1, $2, $3)
                    RETURNING id`
                  ;
                  const optionResult = await client.query(optionQuery, [optionInsertId, attribute.name, productId]);
                  optionId = optionResult.rows[0].id;
                } else {
                  optionId = existingOption.rows[0].id;
                }
          
                // Insert option values (product_option_value)
                const checkExistingOptionValueQuery = 
                `SELECT * FROM public.product_option_value WHERE value = $1 AND option_id = $2 AND variant_id = $3`
              ;
              const existingOptionValue = await client.query(checkExistingOptionValueQuery, [attribute.value, optionId, variantResult.rows[0].id]);
  
          
                // if (existingOptionValue.rows.length === 0) {
                  const optionValueId = generateRandomId('optval_');
                  const optionValueQuery = 
                    `INSERT INTO public.product_option_value (id, value, option_id, variant_id)
                    VALUES ($1, $2, $3, $4)`
                  ;
                  await client.query(optionValueQuery, [optionValueId, attribute.option, optionId, variantResult.rows[0].id]);
                // }
              }
              
          }
          
          
    
        }
    }

    res.status(200).json({ message: "Products processed successfully." });
  } catch (error) {
    console.error("Error processing products:", error);
    res.status(500).json({ error: "Failed to process products" });
  }
};

const getProductTablesByProductId = async (req, res) => {
  try {
    console.log("hello");
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const query = `
      SELECT * 
      FROM public.product_tables 
      WHERE product_id = $1;
    `;

    const { rows } = await client.query(query, [product_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No tables found for this product ID' });
    }

    res.status(200).json({ tables: rows });
  } catch (error) {
    console.error('Error fetching product tables:', error);
    res.status(500).json({ error: 'Failed to fetch product tables' });
  }
};


module.exports = { getProduct, getProductTablesByProductId };


