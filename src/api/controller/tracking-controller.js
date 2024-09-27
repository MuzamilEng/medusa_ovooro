// const axios = require('axios');
// const TRACKING_KEY = '5CDEC7B94FE74A09AFC515F2AE2A624B';
// const { Pool } = require('pg');

// // Create a new Pool instance
// const pool = new Pool({
//   user: 'admin', 
//   host: 'localhost',
//   database: 'medusa_ovooro',
//   password: 'root', 
//   port: 5432,
// });


// // Function to get tracking information from 17 Track API
// async function getTrackingInfo(trackingNumber, carrierCode) {
//   try {
//     const response = await axios.post('https://api.17track.net/track/v2.2', 
//       [
//         {
//           number: trackingNumber,
//           carrier: carrierCode
//         }
//       ],
//       {
//         headers: {
//           '17token': TRACKING_KEY,
//           'Content-Type': 'application/json'
//         }
//       }
//     );

//     return response.data;
//   } catch (error) {
//     console.error('Error fetching tracking info:', error.response ? error.response.data : error.message);
//     throw error;
//   }
// }


// // Controller to fetch and save tracking information
// exports.trackPackage = async (req, res) => {
//   const { trackingNumber } = req.params;
//   console.log('====================================');
//   console.log(`Tracking number: ${trackingNumber}`);
//   console.log('====================================');

//   try {
//     // Fetch tracking info from 17 Track API
//     const trackingInfo = await getTrackingInfo(trackingNumber);

//     // Save tracking info to PostgreSQL
//     const client = await pool.connect();
//     const query = `
//       INSERT INTO tracking (tracking_number, carrier_code, status, last_updated)
//       VALUES ($1, $2, $3, $4)
//       RETURNING id;
//     `;

//     const values = [
//       trackingInfo.tracking_number,
//       trackingInfo.carrier_code,
//       trackingInfo.status,
//       new Date(trackingInfo.last_updated),
//     ];

//     const result = await client.query(query, values);
//     client.release();

//     res.status(200).json({
//       message: 'Tracking information saved successfully',
//       trackingId: result.rows[0].id,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Controller to get tracking information from the database
// exports.getTracking = async (req, res) => {
//   const { trackingNumber } = req.params;

//   try {
//     const client = await pool.connect();
//     const query = `SELECT * FROM tracking WHERE tracking_number = $1;`;
//     const result = await client.query(query, [trackingNumber]);
//     client.release();

//     if (result.rows.length > 0) {
//       res.status(200).json(result.rows[0]);
//     } else {
//       res.status(404).json({ message: 'Tracking number not found' });
//     }
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
