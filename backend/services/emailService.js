import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    // Adding this 'socketTimeout' and 'family' configuration
    socketTimeout: 10000, 
    connectionTimeout: 10000,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    },
    // This forces the use of IPv4, bypassing ENETUNREACH on IPv6 addresses
    family: 4 
});

/**
 * Sends an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} body - The HTML content of the email
 */
export const sendEmail = async (to, subject, body) => {
    try {
        const info = await transporter.sendMail({
            from: `"JJTL Warehouse System" <${process.env.EMAIL}>`,
            to,
            subject,
            html: body // Change 'text' to 'html' to render tags correctly
        });

        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
};