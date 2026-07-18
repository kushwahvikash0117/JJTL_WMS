import transporter from '../config/mail.js';

/**
 * Sends a generic email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email body
 */
export const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"JJTL Warehouse System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('[EmailService] Error:', error);
    throw new Error('Failed to send email');
  }
};