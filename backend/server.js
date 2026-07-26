/**
 * @file server.js
 * @description Entry point for the JJTL WMS application. Connects to the database and starts the Express server.
 */

import 'dotenv/config'; // Loads environment variables from the .env file
import app from './app.js';
import connectDB from './config/db.js';

// Initialize MongoDB Connection
connectDB();

const PORT = process.env.PORT || 5005;

// Start Express Server
app.listen(PORT, () => {
  console.log(`[Server] JJTL WMS is running on port ${PORT}`);
});