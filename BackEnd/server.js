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

// Profile Page Routes
app.get('/profile', (req, res) => {
  const { student_id, lecturer_id } = req.query;
  
  if (!student_id && !lecturer_id) {
    return res.status(400).send("student_id hoặc lecturer_id là bắt buộc");
  }

  if (student_id) {
    return res.sendFile(path.join(__dirname, '../FrontEnd/Student_Information/student_info.html'));
  } else {
    return res.sendFile(path.join(__dirname, '../FrontEnd/Lecturer_Information/lecturer_info.html'));
  }
}); 

// Khởi động server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});