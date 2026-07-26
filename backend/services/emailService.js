/**
 * @file emailService.js
 * @description Configures nodemailer transporter and provides a helper function to send emails.
 */

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    socketTimeout: 10000, 
    connectionTimeout: 10000,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    },
    // Forces IPv4 to bypass ENETUNREACH issues on networks lacking IPv6 connectivity
    family: 4 
});

/**
 * Sends an HTML email to the specified recipient.
 * 
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} body - The HTML content of the email
 * @returns {Promise<Object>} The mail transport response information
 */
export const sendEmail = async (to, subject, body) => {
    try {
        const info = await transporter.sendMail({
            from: `"JJTL Warehouse System" <${process.env.EMAIL}>`,
            to,
            subject,
            html: body
        });

        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
};