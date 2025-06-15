// BackEnd\server.js
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const jwt = require('jsonwebtoken');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

// Kết nối database
const connectDB = require('../Database/connectDB');
connectDB();

// Middleware
app.use(cors({
  origin: 'https://chatbotuit.id.vn/',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Chỉ dùng đúng 1 lần middleware body-parser tích hợp của Express
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Passport
const passport = require("passport");
require('./passport');
app.use(passport.initialize());
const authRoutes = require('./Routes/auth');
app.use('/auth', authRoutes);

// Serve static files
const frontendPath = path.join(__dirname, '../FrontEnd');
app.use(express.static(frontendPath));
app.use(express.static('public'));

// Serve role-based menus
app.use('/student/menu', express.static(path.join(__dirname, '../FrontEnd/Student_Menu')));
app.use('/lecturer/menu', express.static(path.join(__dirname, '../FrontEnd/Lecturer_Menu')));
app.use('/admin/menu', express.static(path.join(__dirname, '../FrontEnd/Admin_Menu')));

// Home route
const { increaseHomeVisit } = require('./Controllers/admin/HomeStatisticsController');
app.get('/', increaseHomeVisit, (req, res) => {
  res.sendFile(path.join(__dirname, '../FrontEnd/Home/home.html'));
});

// Routes
const adminRoutes = require('./Routes/admin');
const studentRoutes = require('./Routes/student');
const lecturerRoutes = require('./Routes/lecturer');
const chatbotRoutes = require('./Routes/chatbot');
const feedbackRoutes = require('./Routes/feedback');

app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/lecturer', lecturerRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api', feedbackRoutes); // /api/feedbacks-form

// Google OAuth route
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Auth route again (optional depending on logic)
app.use("/api/auth", authRoutes);

// Start server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
