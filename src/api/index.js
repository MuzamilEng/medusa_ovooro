import { Router } from 'express';
import express from 'express';
import axios from 'axios';
import bodyParser from "body-parser"
const fileUpload = require("express-fileupload");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const multer = require('multer');
const { Client } = require('pg');
const https = require("https")

// import { getOrderBYId } from 'src/admin/orderService';
// import PostService from 'src/services/post';
// const {getProducts} = require('./controller/product-controller')
// const trackingController = require('./controller/tracking-controller');
// const {logNewCarts} = require('./controller/cart-controller');
const {getProduct, getProductTablesByProductId} = require('./controller/testController');


// Route to log new carts

const client = new Client({
  connectionString: "postgresql://tcfxxx54asdalk:PaDGBC6CKF8J9lEKHWf3Cga8p9f9Hs3WYAnxZY26hex27lprG7kRpQ@db1.sigma.thechristmasfabric.com:49327/tcf_live?sslmode=require",
  // connectionString: "postgresql://admin:root@localhost:5432/medusa_ovooro4",
});

client.connect();

export default () => {
  const router = Router()
  const corsOptions = {
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:5173",
        "https://ovooro-store.vercel.app",
        "https://medusa-ovooro.vercel.app", // Your custom frontend
        // Your custom frontend
        "http://localhost:7000", // Medusa admin dashboard
      ];
  
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow credentials (like cookies)
  };
  
  // Use the CORS middleware with the updated options
  router.use(cors(corsOptions));
  
  
  // Use the CORS middleware with dynamic options
  router.use(cors(corsOptions));
  
  router.use(express.json())
  router.use(express.urlencoded({ extended: true }))
  // Route to fetch and save tracking information

  router.get('/store/test',  getProduct);
  router.post('/store/getProductTables', getProductTablesByProductId); // Add this route after the product fetching route


  const chainableBaseURL = 'https://api.chainable.com/v1'; // Replace with Chainable's base URL
  const chainableToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXAiOiJhcGkiLCJjaWQiOjgzNjYwLCJzZXEiOjEsIm5iZiI6MTcyODM5Mzc4NywidnNuIjoxfQ.lgvdm_MDR0AswvPETX59wyf16DKeISN0ZvCk7Hqi1qc';
  
  async function fetchAndSendProductToChainable() {
    try {
      // Step 1: Fetch the first product from your MedusaJS endpoint
      const productResponse = await axios.get('https://api-mzml.ovooro.com/store/products'); // Replace with your actual backend URL
      const product = productResponse.data.product;
  
      console.log('Fetched product:', product);
  
      // Step 2: Send the product data to Chainable
      const response = await axios.post(`${chainableBaseURL}/products/feed`, product, {
        headers: {
          'Authorization': `Bearer ${chainableToken}`,
          'Content-Type': 'application/json',
        }
      });
  
      console.log('Product sent to Chainable:', response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  }


// Exchange Rates API settings
const API_KEY = "251d4e926ba8761e0d388bd7bfc21507";
const API_URL = `https://open.er-api.com/v6/latest/EUR`; // Using Exchangerates API with EUR as the base

// Function to convert and round the price
async function convertAndSetPrice(basePriceEUR, manualRateMarkup = 1) {
  try {
    // Fetch exchange rates from API
    const response = await axios.get(`${API_URL}?apikey=${API_KEY}`);
    const exchangeRates = response.data.rates;

    // Array to store prices in different currencies
    const prices = [];

    // Target currencies you want to convert to
    const targetCurrencies = ["SEK", "USD", "GBP"];

    targetCurrencies.forEach((currency) => {
      if (exchangeRates[currency]) {
        // Calculate the converted price
        let convertedPrice =
          basePriceEUR * exchangeRates[currency] * (1 + manualRateMarkup / 100);

        // Round to the nearest .90
        convertedPrice = Math.round(convertedPrice / 0.90) * 0.90;

        // Add to prices array
        prices.push({
          amount: parseInt(convertedPrice),
          currency_code: currency,
        });
      }
    });

    return prices;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    return [];
  }
}


async function createTranslations(text) {
  try {
    const apiKey = "f5fd0581-eb51-13a1-ce70-bd93d719b6ec"; // Your DeepL API key
    const url = "https://api.deepl.com/v2/translate";

    // Making requests for each target language separately as DeepL requires
    const languages = ["DE", "FR", "EN"];
    const translations = {};

    for (const lang of languages) {
      const response = await axios.post(
        url,
        null, // POST request with URL parameters
        {
          params: {
            auth_key: apiKey,
            text: text,
            target_lang: lang,
          },
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      // DeepL returns the translation in the `text` field of the response
      const translatedText = response.data.translations[0].text;
      if (lang === "DE") translations.de = translatedText;
      if (lang === "FR") translations.fr = translatedText;
      if (lang === "EN") translations.en = translatedText;
    }

    return translations;
  } catch (error) {
    console.error("Error creating translations:", error);
    return {
      en: text, // Fallback to original text
      de: text,
      fr: text,
    };
  }
}

// Custom API route to save the product
router.post("/store/custom", cors(corsOptions), async (req, res) => {
  const {data: product, token} = req.body;

  try {
    // Step 1: Generate translations for title, handle, description, and short_description
    const titleTranslations = await createTranslations(product.title);
    const handleTranslations = await createTranslations(product.handle);
    const descriptionTranslations = await createTranslations(product.description);
    const shortDescriptionTranslations = await createTranslations(
      product.short_description || product.description // Use description if short_description is not available
    );

    // Step 2: Iterate through each variant to convert prices and append them to the prices array
    const manualRateMarkup = 1; // Default to 1% markup
    const updatedVariants = await Promise.all(
      product.variants.map(async (variant) => {
        const basePriceEUR = variant.prices[0]?.amount || 0; // Get the base price in EUR
        const convertedPrices = await convertAndSetPrice(basePriceEUR, manualRateMarkup);

        return {
          ...variant,
          prices: [
            ...variant.prices, // Existing prices
            ...convertedPrices, // Appended converted prices
          ],
        };
      })
    );

    // Step 3: Prepare the complete product payload with updated variants and metadata
    const productPayload = {
      ...product,
      variants: updatedVariants,
      metadata: {
          title: titleTranslations,
          handle: handleTranslations,
          description: descriptionTranslations,
          short_description: shortDescriptionTranslations,
      },
    };


    // Step 4: Send the payload to the admin/products route
    const response = await axios.post(
      "https://api-mzml.ovooro.com/admin/products",
      productPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

    res.status(201).json(response.data);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
}); 
  
  // get all regions
  router.post('/store/regions', cors(corsOptions), async (req, res) => {
    try {
      const {token} = req.body
      const response = await fetch("https://api-mzml.ovooro.com/admin/regions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
  
      // Parse the response as JSON
      const data = await response.json();
      // Return the parsed data
     return res.json({ regions: data.regions });
    } catch (error) {
      console.error('Error fetching regions:', error);
      res.status(500).json({ error: 'Failed to fetch regions' });
    }
  });
  
  

// Ensure the uploads directory exists
// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads')); // Make sure this path exists
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });
function generateRandomId(prefix = 'prod_') {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix;
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

router.post('/store/thumbnail', upload.single('image'), cors(corsOptions), async (req, res) => {
  try {
    const image = req.file;

    if (!image) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Generate the image URL for saving in the database
    const imageUrl = `/uploads/${image.filename}`;

    // Insert into the PostgreSQL database
    const query = `
      INSERT INTO public.image (id, url)
      VALUES ($1, $2)
      RETURNING id, url, created_at, updated_at
    `;
    const id = generateRandomId('img_');
    const values = [ id, imageUrl];

    const result = await client.query(query, values);

    res.json(result.rows[0]); // Send back the inserted row data
  } catch (error) {
    console.error('Error saving image:', error);
    res.status(500).json({ error: 'Error uploading image.' });
  }
});
  


router.post('/store/media', upload.array('images', 10), cors(corsOptions), async (req, res) => { // Limit to 10 files at a time
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    // Prepare queries for inserting each image URL into the database
    const query = `
      INSERT INTO public.image (id, url)
      VALUES ($1, $2)
      RETURNING id, url, created_at, updated_at
    `;

    const results = [];
    for (const file of files) {
      const id = generateRandomId('img_');
      const imageUrl = `/uploads/${file.filename}`;
      const values = [id, imageUrl];
      
      const result = await client.query(query, values);
      results.push(result.rows[0]); // Collect each inserted row's data
    }

    res.json(results); // Send back all inserted rows
  } catch (error) {
    console.error('Error saving images:', error);
    res.status(500).json({ error: 'Error uploading images.' });
  }
});
  router.get('/store/ping', (req, res) => {
    // fetchAndSendProductToChainable();
    res.json({
      message: 'Pong from the server!',
    });
  });

  
  // router.get('/store/cartmail', logNewCarts);


  // router.post('/store/track/:trackingNumber', trackingController.trackPackage);
  // Route to get tracking information from the database
  // router.get('/store/tracking/:trackingNumber', trackingController.getTracking);
  // Route to fetch products from Strapi
  // router.get('/store/categories', getProducts)
  // Route to fetch oders from admin
  // router.get('/store/orders/:orderId', getOrderBYId)
  
  // router.get("/admin/orders/:orderId", getOrderClaims);


  return router;
};

// variant_01J52WJ79PV8ATSDJHB689W6C4