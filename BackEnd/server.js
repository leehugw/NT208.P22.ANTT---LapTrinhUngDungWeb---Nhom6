// server.js
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require('path');
const bodyParser = require("body-parser");
const app = express();

// Kết nối database
const connectDB = require('../Database/connectDB');
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());

const frontendPath = path.join(__dirname, '../Frontend');
app.use(express.static(frontendPath));

// Cấu hình static files chung
const staticDirs = [
  { route: '/student-info', path: '../FrontEnd/Student_Information' },
  { route: '/lecturer-info', path: '../FrontEnd/Lecturer_Information' },
];

staticDirs.forEach(dir => {
  app.use(dir.route, express.static(path.join(__dirname, dir.path)));
});

// Import Routes
const adminRoutes = require('./Routes/admin');
const studentRoutes = require('./Routes/student');
const lecturerRoutes = require('./Routes/lecturer');

// Register Routes
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/lecturer', lecturerRoutes);


// Khởi động server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});