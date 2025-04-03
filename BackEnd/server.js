// server.js
const express = require('express');
const app = express();

const connectDB = require('../Database/connectDB');
const adminRoutes = require('./Routes/admin');
const studentRoutes = require('./Routes/student');

// Kết nối database
connectDB();

// Đăng ký các route
app.use(express.json());
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

// Khởi động server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});