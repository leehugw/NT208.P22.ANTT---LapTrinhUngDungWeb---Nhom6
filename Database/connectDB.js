const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');

const mongoURI = process.env.DB_URI; 

if (!mongoURI) {
  console.error("MongoDB URI is not defined in the environment variables");
  process.exit(1);
}

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI, {});
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Thoát nếu không kết nối được
  }
};

module.exports = connectDB;
