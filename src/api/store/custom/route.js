// import { Router } from 'express';
// import axios from 'axios';
// import { getOrderBYId } from 'src/admin/orderService';
// import { getProducts } from 'src/api/controller/product-controller';
// // import PostService from 'src/services/post';
// const trackingController = require('./controller/tracking-controller');
// // src/api/admin/index.js (or similar)
// const { getOrderClaims } = require('./admin/getOrderClaims');

// export default () => {
//   const router = Router();
//   // Route to fetch and save tracking information
//   router.post('/store/track/:trackingNumber', trackingController.trackPackage);
//   // Route to get tracking information from the database
//   router.get('/store/tracking/:trackingNumber', trackingController.getTracking);
//   // Route to fetch products from Strapi
//   router.get('/category', getProducts)
//   // Route to fetch oders from admin
//   // router.get('/store/orders/:orderId', getOrderBYId)
  
//   router.get("/admin/orders/:orderId", getOrderClaims);


//   return router;
// };
