
const cron = require('node-cron');
const { Client } = require('pg');
const mailjet = require('node-mailjet');

// PostgreSQL client setup
const client = new Client({
  // connectionString: "postgresql://tcfxxx54asdalk:PaDGBC6CKF8J9lEKHWf3Cga8p9f9Hs3WYAnxZY26hex27lprG7kRpQ@db1.sigma.thechristmasfabric.com:49327/tcf_live?sslmode=require",
  connectionString: "postgresql://admin:root@localhost:5432/medusa_ovooro4",

});

// Mailjet setup
const mailjetClient = mailjet.apiConnect('3e83f2bf1bd4db896d56ec7193b86b76', '4c883644bf6be0a4363caf34962842de');

client.connect();

// Function to send email using Mailjet
const sendEmail = async (to, cartId) => {
  try {
    const request = await mailjetClient
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: "testmuzamil41@gmail.com",  // Replace with your email
              Name: "Your Company Name",        // Replace with your company name
            },
            To: [
              {
                Email: to,
                Name: "Customer",
              },
            ],
            Subject: "Reminder: Your Cart is Still Pending",
            TextPart: `Hello, \n\nYou have a pending cart with ID ${cartId}. Please complete your purchase soon. \n\nBest regards, \nYour Company`,
            HTMLPart: `<p>Hello,</p><p>You have a pending cart with ID <strong>${cartId}</strong>. Please complete your purchase soon.</p><p>Best regards,<br>Your Company</p>`,
          },
        ],
      });

    console.log(`Email sent to ${to} for cart ID ${cartId}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
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

// Schedule the task to run every minute
cron.schedule("* * * * *", () => {
  // logNewCarts();
});

// Keep the Node.js process running
console.log("Scheduler started. Press Ctrl+C to exit.");
