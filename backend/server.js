import 'dotenv/config'; // Loads variables from .env file
import app from './app.js';
import connectDB from './config/db.js';

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5005;

// Start Server
app.listen(PORT, () => {
  console.log(`[Server] JJTL WMS is running on port ${PORT}`);
});