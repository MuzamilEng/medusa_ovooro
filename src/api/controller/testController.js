const express = require('express');
const axios = require('axios');
const { Client } = require('pg');

const app = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = new Client({
  connectionString: "postgresql://tcfxxx54asdalk:PaDGBC6CKF8J9lEKHWf3Cga8p9f9Hs3WYAnxZY26hex27lprG7kRpQ@db1.sigma.thechristmasfabric.com:49327/tcf_live?sslmode=require",
});
client.connect();

const tableData = ''

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
      const tableInsertQuery = `
        INSERT INTO public.product_tables (product_id, table_id, table_data)
        VALUES ($1, $2, $3)
      `;
      
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
      const meta_data = productDetails.meta_data || [];

      // Iterate over the translations object in productDetails
      const translations = productDetails.translations;
      
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

          // Extract the description, short_description, and add the lang
          const translationData = {
            description: translatedProduct.description || '',
            short_description: translatedProduct.short_description || '',
            lang: lang // language key
          };

          // Push this translation into the meta_data array
          meta_data.push(translationData);
        }
      }

      console.log(meta_data, "Updated Meta Data with Translations");




        const productQuery = `
          INSERT INTO public.product (id, title, description, handle, weight, length, height, width, thumbnail, short_description, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;
        await client.query(productQuery, [
          productId, productDetails.name || '', productDetails.description || '', productDetails.slug || '',
          parseInt(productDetails.weight) || 0, parseInt(productDetails.dimensions.length) || 0,
          parseInt(productDetails.dimensions.height) || 0, parseInt(productDetails.dimensions.width) || 0,
          productDetails.images[0]?.src || '', productDetails.short_description || '' , JSON.stringify(meta_data)
        ]);


          // Insert related products
          const relatedProductQuery = `
          INSERT INTO public.product_category (id, name, handle, related_id)
          VALUES ($1, $2, $3, $4)
          `;
          
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
      const imageInsertQuery = `
        INSERT INTO public.image (id, url, image_data) 
        VALUES ($1, $2, $3)
      `;

      for (const image of productDetails.images) {
        const imageId = generateRandomId('Img_');
        const imageData = await downloadImage(image.src); // Download the image data as binary
        await client.query(imageInsertQuery, [imageId, image.src, imageData]); // Insert image into the DB
        
        // Insert into public.product_images table
        const productImageInsertQuery = `
          INSERT INTO public.product_images (product_id, image_id) 
          VALUES ($1, $2)
        `;
        await client.query(productImageInsertQuery, [productId, imageId]);
      }

        // Loop through variants and insert them along with their options and values
        // for (const variant of variants) {
        //   const variantId = generateRandomId('variant_');
          
        //   // Insert variant into the database
        //   const variantQuery = `
        //     INSERT INTO public.product_variant (id, title, product_id, inventory_quantity)
        //     VALUES ($1, $2, $3, $4)
        //     RETURNING id
        //   `;
        //   const variantResult = await client.query(variantQuery, [variantId, variant.name, productId, variant.stock_quantity || 1000]);

        //   // Insert the money amount for this variant
        //   const moneyAmountId = generateRandomId('mon_');
        //   const moneyAmountQuery = `
        //     INSERT INTO public.money_amount (id, currency_code, amount)
        //     VALUES ($1, $2, $3)
        //     RETURNING id
        //   `;
        //   const moneyAmountResult = await client.query(moneyAmountQuery, [moneyAmountId, 'eur', parseInt(variant.price) || 0]);

        //   // Link variant to its money amount
        //   const productVariantMoneyAmountId = generateRandomId('pvma_');
        //   const productVariantMoneyAmountQuery = `
        //     INSERT INTO public.product_variant_money_amount (id, money_amount_id, variant_id)
        //     VALUES ($1, $2, $3)
        //   `;
        //   await client.query(productVariantMoneyAmountQuery, [productVariantMoneyAmountId, moneyAmountResult.rows[0].id, variantResult.rows[0].id]);

        //   // Loop through product options (attributes)
        //   for (const attribute of productDetails.attributes) {
        //     const optionId = generateRandomId('opt_');

        //     // Insert the product option if not already inserted
        //     const optionQuery = `
        //       INSERT INTO public.product_option (id, title, product_id)
        //       VALUES ($1, $2, $3)
        //       RETURNING id
        //     `;
        //     const optionResult = await client.query(optionQuery, [optionId, attribute.name, productId]);

        //     // Insert the option values and associate them with the variant
        //     for (const optionValue of attribute.options) {
        //       const optionValueId = generateRandomId('optval_');
              
        //       // Insert option value into the product_option_value table
        //       const optionValueQuery = `
        //         INSERT INTO public.product_option_value (id, value, option_id, variant_id)
        //         VALUES ($1, $2, $3, $4)
        //       `;
        //       await client.query(optionValueQuery, [optionValueId, optionValue, optionResult.rows[0].id, variantResult.rows[0].id]);
        //     }
        //   }
        // }

        // Loop through variants and insert them along with their options and values
for (const variant of variants) {
    const variantId = generateRandomId('variant_');
  
    // Check if this variant already exists in the database
    const checkExistingVariantQuery = `
      SELECT * FROM public.product_variant WHERE product_id = $1 AND title = $2
    `;
    const existingVariant = await client.query(checkExistingVariantQuery, [productId, variant.name]);
  
    if (existingVariant.rows.length === 0) {
      // Insert the new variant if it doesn't exist
      const variantQuery = `
        INSERT INTO public.product_variant (id, title, product_id, inventory_quantity)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      const variantResult = await client.query(variantQuery, [variantId, variant.name, productId, variant.stock_quantity || 1000]);
  
      // Insert the money amount for this variant
      const moneyAmountId = generateRandomId('mon_');
      const moneyAmountQuery = `
        INSERT INTO public.money_amount (id, currency_code, amount)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      const moneyAmountResult = await client.query(moneyAmountQuery, [moneyAmountId, 'eur', parseInt(variant.price) || 0]);
  
      // Link variant to its money amount
      const productVariantMoneyAmountId = generateRandomId('pvma_');
      const productVariantMoneyAmountQuery = `
        INSERT INTO public.product_variant_money_amount (id, money_amount_id, variant_id)
        VALUES ($1, $2, $3)
      `;
      await client.query(productVariantMoneyAmountQuery, [productVariantMoneyAmountId, moneyAmountResult.rows[0].id, variantResult.rows[0].id]);
  
      // Loop through product options (attributes)
      for (const attribute of productDetails.attributes) {
        const optionId = generateRandomId('opt_');
  
        // Check if this option already exists for the product
        const checkExistingOptionQuery = `
          SELECT * FROM public.product_option WHERE product_id = $1 AND title = $2
        `;
        const existingOption = await client.query(checkExistingOptionQuery, [productId, attribute.name]);
  
        let optionResult;
        if (existingOption.rows.length === 0) {
          // Insert the product option if it doesn't exist
          const optionQuery = `
            INSERT INTO public.product_option (id, title, product_id)
            VALUES ($1, $2, $3)
            RETURNING id
          `;
          optionResult = await client.query(optionQuery, [optionId, attribute.name, productId]);
        } else {
          // Use the existing option
          optionResult = existingOption;
        }
  
        // Insert the option values and associate them with the variant
        for (const optionValue of attribute.options) {
          const optionValueId = generateRandomId('optval_');
  
          // Check if this option value already exists for the option
          const checkExistingOptionValueQuery = `
            SELECT * FROM public.product_option_value WHERE option_id = $1 AND value = $2 AND variant_id = $3
          `;
          const existingOptionValue = await client.query(checkExistingOptionValueQuery, [optionResult.rows[0].id, optionValue, variantResult.rows[0].id]);
  
          if (existingOptionValue.rows.length === 0) {
            // Insert the option value if it doesn't exist
            const optionValueQuery = `
              INSERT INTO public.product_option_value (id, value, option_id, variant_id)
              VALUES ($1, $2, $3, $4)
            `;
            await client.query(optionValueQuery, [optionValueId, optionValue, optionResult.rows[0].id, variantResult.rows[0].id]);
          }
        }
      }
    } else {
      console.log(`Variant already exists: ${variant.name}`);
    }
  }
  
      }
    }

    res.json({ message: 'Products and associated data inserted successfully!' });
  } catch (error) {
    console.error('Error inserting products and images:', error);
    res.status(500).json({ error: 'Failed to insert products and images' });
  }
};



const getProductTablesByProductId = async (req, res) => {
  try {
    
    console.log("hello");
    const { product_id } = req.body;
    console.log('====================================');
    console.log('====================================');
    console.log('Request body:', req.body); // Log the request body

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


// currency exchange code


// const axios = require("axios");

// // Your API key
// const access_key = "251d4e926ba8761e0d388bd7bfc21507";

// // Function to fetch the exchange rate, apply the markup, and round to the nearest 0.90
// async function convertCurrencyWithMarkup(from, to, amount, markup) {
//   const endpoint = "latest";
//   const url = https://api.exchangeratesapi.io/v1/${endpoint}?access_key=${access_key}&base=${from}&symbols=${to};

//   try {
//     const response = await axios.get(url);
//     if (response.data.success) {
//       const rate = response.data.rates[to];
//       const rawResult = amount * rate; // EUR PRICE * EXCHANGE RATE
//       const resultWithMarkup = rawResult * (1 + markup / 100); // Adding manual markup

//       // Round to the nearest 0.90
//       const roundedResult = Math.round(resultWithMarkup / 0.9) * 0.9;

//       console.log(Original Conversion: ${rawResult} ${to});
//       console.log(After ${markup}% Markup: ${resultWithMarkup} ${to});
//       console.log(Rounded Price: ${roundedResult} ${to});
//     } else {
//       console.log("Error:", response.data.error);
//     }
//   } catch (error) {
//     console.error("Currency conversion failed:", error.message);
//   }
// }

// // Example usage:
// // Convert 21.90 EUR to SEK, apply a 1% markup, and round to the nearest 0.90
// convertCurrencyWithMarkup("EUR", "SEK", 21.9, 1);
