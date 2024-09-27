import { Router } from 'express';
import axios from 'axios';
// import { getOrderBYId } from 'src/admin/orderService';
// import PostService from 'src/services/post';
// const {getProducts} = require('./controller/product-controller')
// const trackingController = require('./controller/tracking-controller');
const {logNewCarts} = require('./controller/cart-controller');
const {getProduct} = require('./controller/testController');


// Route to log new carts

export default () => {
  const router = Router();
  // Route to fetch and save tracking information
  router.get('/store/ping', (req, res) => {
    res.json({
      message: 'Pong from the server!',
    });
  });

  router.get('/store/test', getProduct);
  
  router.get('/store/cartmail', logNewCarts);


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
