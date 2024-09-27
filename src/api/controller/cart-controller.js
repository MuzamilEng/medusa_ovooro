const cron = require('node-cron');
const { Client } = require('pg');
const nodemailer = require('nodemailer');
const {google} = require('googleapis');
// PostgreSQL client setup
const client = new Client({
  connectionString: "postgresql://tcfxxx54asdalk:PaDGBC6CKF8J9lEKHWf3Cga8p9f9Hs3WYAnxZY26hex27lprG7kRpQ@db1.sigma.thechristmasfabric.com:49327/tcf_live?sslmode=require",
});

const mailjet = require('node-mailjet');
const mailjetClient = mailjet.apiConnect('3e83f2bf1bd4db896d56ec7193b86b76', '4c883644bf6be0a4363caf34962842de');

client.connect();

// Function to send email
// const sendEmail = async (email, cartId) => {
//   try {
//     const request = await mailjetClient
//       .post('send', { version: 'v3.1' })
//       .request({
//         Messages: [
//           {
//             From: {
//               Email: "your-email@example.com",
//               Name: "Your Company Name",
//             },
//             To: [
//               {
//                 Email: email,
//                 Name: "Customer",
//               },
//             ],
//             Subject: "Reminder: Your Cart is Still Pending",
//             TextPart: `Hello, \n\nYou have a pending cart with ID ${cartId}. Please complete your purchase soon. \n\nBest regards, \nYour Company`,
//             HTMLPart: `<p>Hello,</p><p>You have a pending cart with ID <strong>${cartId}</strong>. Please complete your purchase soon.</p><p>Best regards,<br>Your Company</p>`,
//           },
//         ],
//       });

//     console.log(`Email sent to ${email} for cart ID ${cartId}`);
//   } catch (error) {
//     console.error(`Error sending email to ${email}:`, error);
//   }
// };
const CLIENT_ID = '327001933009-8dob1g42j3aehpeqqd31k86qv8afi6bq.apps.googleusercontent.com';


const CLIENT_SECRET = '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';

const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

const REFRESH_TOKEN = '1//042SQkcQNsbQfCgYIARAAGAQSNwF-L9IrjOGjkoLfJF7crFh7Hp2d2AYhetCxkkh0f-KJkCidrFjtU8lqqh1IPaPXhCXZBjbsvHQ';

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

export const sendEmail = async (to, subject="Reminder: Your Cart is Still Pending", text="Hello, \n\nYou have a pending cart with ID ${cartId}. Please complete your purchase soon. \n\nBest regards, \nYour Company", cartId) => {
  try {
    const accessToken = await oAuth2Client.getAccessToken();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "testmuzamil41@gmail.com",
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: "Medusa <testmuzamil41@gmail.com>",
      to: to,
      subject: subject,
      text: text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(result,'result');
    return result;
    
  } catch (error) {
    console.log(error, "Error sending mail");
  }
};
// Function to check and log new carts and send emails
const logNewCarts = async () => {
  try {
    // Query to fetch carts that are incomplete and without payment
    const query = `
      SELECT *
      FROM public.cart
      WHERE completed_at IS NULL
        AND payment_id IS NULL
    `;
    
    const res = await client.query(query);

    if (res.rows.length > 0) {
      console.log("New cart(s) added:");

      const filteredEmailCarts = res.rows.filter(cart => cart.email !== null);

      console.log(filteredEmailCarts, "filteredEmailCarts");

      // Send email to the customer
      for (const cart of filteredEmailCarts) {
        await sendEmail(cart.email, cart.id);
      }


    } else {
      console.log("No new carts found.");
    }
  } catch (err) {
    console.error("Error checking for new carts:", err); 
  }
};


// Export the function  
module.exports = { logNewCarts };

// Schedule the task to run every minute
// cron.schedule("* * * * *", () => {
//   logNewCarts();
// });

// Keep the Node.js process running
console.log("Scheduler started. Press Ctrl+C to exit.");




// custom email code from woo commerce


