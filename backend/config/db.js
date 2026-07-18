import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Ensure MONGO_URI is set in your .env file
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`[Database] Connected successfully to: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database] Connection Error: ${error.message}`);
    // Exit process with failure to prevent the app from running in an inconsistent state
    process.exit(1);
  }
};

export default connectDB;