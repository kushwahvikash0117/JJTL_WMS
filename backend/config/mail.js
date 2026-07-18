import nodemailer from 'nodemailer';

// Configure the transporter using environment variables for security
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, // Use true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify the connection configuration immediately
transporter.verify((error, success) => {
  if (error) {
    console.error('[Mail] Configuration Error:', error);
  } else {
    console.log('[Mail] Server is ready to take our messages');
  }
});

export default transporter;