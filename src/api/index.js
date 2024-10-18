import { Router } from 'express';
import express from 'express';
import axios from 'axios';
import bodyParser from "body-parser"

// import { getOrderBYId } from 'src/admin/orderService';
// import PostService from 'src/services/post';
// const {getProducts} = require('./controller/product-controller')
// const trackingController = require('./controller/tracking-controller');
// const {logNewCarts} = require('./controller/cart-controller');
const {getProduct, getProductTablesByProductId} = require('./controller/testController');


// Route to log new carts

export default () => {
  const router = Router()

  router.use(express.json())
  router.use(express.urlencoded({ extended: true }))

  // Route to fetch and save tracking information

  router.get('/store/test', getProduct);
  router.post('/store/getProductTables', getProductTablesByProductId); // Add this route after the product fetching route


  const chainableBaseURL = 'https://api.chainable.com/v1'; // Replace with Chainable's base URL
  const chainableToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXAiOiJhcGkiLCJjaWQiOjgzNjYwLCJzZXEiOjEsIm5iZiI6MTcyODM5Mzc4NywidnNuIjoxfQ.lgvdm_MDR0AswvPETX59wyf16DKeISN0ZvCk7Hqi1qc';
  
  async function fetchAndSendProductToChainable() {
    try {
      // Step 1: Fetch the first product from your MedusaJS endpoint
      const productResponse = await axios.get('http://localhost:9000/store/products'); // Replace with your actual backend URL
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

// curl -X POST 'http://localhost:9000/admin/auth/token' \
// -H 'Content-Type: application/json' \
// --data-raw '{
//   "email": "admin@medusa-test.com",
//   "password": "supersecret"
// }'
