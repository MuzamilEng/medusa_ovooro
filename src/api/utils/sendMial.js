const nodemailer = require("nodemailer");
const path = require("path");


const HOSTINGER_USER = ''  
const HOSTINGER_PASS = ''

async function createTransporter() {
    try {
      const transporter = nodemailer.createTransport({
        host: "", //
        port: 465, // Use port 465 for secure SMTP (SSL/TLS)
        secure: true, // Use SSL/TLS
        auth: {
          user: HOSTINGER_USER,
          pass: HOSTINGER_PASS,
        },
      });
      
      // Verify transporter configuration
      await transporter.verify();
      return transporter;
    } catch (error) {
      console.error('Error creating transporter:', error);
      throw error;
    }
  }

// Send email function using EJS template
async function sendEmail(to, subject, translatedText) {
    // Input validation
    if (!to || typeof to !== 'string' || !to.includes('@')) {
      throw new Error('Invalid recipient email address');
    }
  
    if (!subject) {
      throw new Error('Email subject is required');
    }
  
    if (!translatedText || typeof translatedText !== 'string') {
      throw new Error('Translated text must be provided as a string');
    }

  try {
    const transporter = await createTransporter();
        
    const mailOptions = {
        from: {
            name: 'Funride',
            address: HOSTINGER_USER
          },
      to: to.trim(), // Ensure no whitespace in email address
      subject: subject,
      text: translatedText, // Plain text version
      html: `<p>${translatedText}</p>`, // HTML version
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // Re-throw the error for proper handling by the caller
  }
}

module.exports = sendEmail;