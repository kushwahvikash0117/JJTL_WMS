import { sendEmail } from './emailService.js';

/**
 * Sends an OTP via email
 * @param {string} email - Recipient email
 * @param {string} otp - The generated OTP code
 */
export const sendOTPEmail = async (email, otp) => {
  const subject = "JJTL Warehouse Management System - Verification Code";
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2>Verification Required</h2>
      <p>Hello,</p>
      <p>Your verification code for the JJ Textiles Warehouse Management System is:</p>
      <h1 style="color: #00e5ff; letter-spacing: 5px;">${otp}</h1>
      <p>This code expires in 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;
  
  await sendEmail(email, subject, html);
};