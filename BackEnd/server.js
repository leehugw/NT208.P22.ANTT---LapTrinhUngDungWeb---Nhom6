// server.js
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const path = require('path');
const bodyParser = require("body-parser");
const app = express();

//Xử lí passport
const mongoose = require("mongoose");
const passport = require("passport");
require('./passport');
const authRoutes = require('./Routes/auth');
app.use('/auth', authRoutes);

app.use(express.json({limit: '100mb'}));
app.use(passport.initialize());

// Kết nối database
const connectDB = require('../Database/connectDB');
connectDB();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For form data

const frontendPath = path.join(__dirname, '../FrontEnd');
app.use(express.static(frontendPath));

// Import Routes
const adminRoutes = require('./Routes/admin');
const studentRoutes = require('./Routes/student');
const lecturerRoutes = require('./Routes/lecturer');
const chatbotRoutes = require('./Routes/chatbot');

// Route to student_menu.html file
app.use('/student/menu', express.static(path.join(__dirname, '../FrontEnd/Student_Menu')));
app.use('/lecturer/menu', express.static(path.join(__dirname, '../FrontEnd/Lecturer_Menu')));
app.use('/admin/menu', express.static(path.join(__dirname, '../FrontEnd/Admin_Menu')));

const { increaseHomeVisit } = require('./Controllers/admin/HomeStatisticsController');
// Direct route to home.html file
app.get('/', increaseHomeVisit, (req, res) => {
  res.sendFile(path.join(__dirname, '../FrontEnd/Home/home.html'));
});

// Route to trigger Google login

//const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=278181169185-sqeskqdu8rnck8l5cakqhplhbjskn2ni.apps.googleusercontent.com&redirect_uri=http://localhost:3000/callback&response_type=code&scope=email`;

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Register Routes
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/lecturer', lecturerRoutes);
app.use('/api/chatbot', chatbotRoutes);

app.use('/api', require('./Routes/feedback'));

app.use("/api/auth", authRoutes);

// Khởi động server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});