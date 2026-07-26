/**
 * @file database.js
 * @description Establishes a secure connection to MongoDB using Mongoose.
 */

import mongoose from 'mongoose';

/**
 * Connects to the MongoDB cluster using the connection string from environment variables.
 * Exits the process if the connection fails to prevent running in an unstable state.
 * 
 * @async
 * @function connectDB
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB using the URI specified in the environment variables
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`[Database] Connected successfully to: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database] Connection Error: ${error.message}`);
    
    // Exit process with failure code (1) to prevent the application from running without a database connection
    process.exit(1);
  }
};

export default connectDB;