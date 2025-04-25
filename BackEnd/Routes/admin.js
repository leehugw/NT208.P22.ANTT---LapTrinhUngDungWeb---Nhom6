// routes/admin.js
const express = require('express');
const path = require('path');
const router = express.Router();
const adminFeedbackService = require('../Services/admin/adminFeedbackService');
const { authenticateToken, authorizeRoles } = require('../Middleware/auth');
const adminChatController = require('../Controllers/admin/adminChatController');
const adminlecturerlistService = require('../Services/admin/adminLecturerListService');
const { getAllStudentsForAdmin } = require('../Controllers/admin/adminStudentController');
const { createLecturer } = require('../Controllers/admin/adminCreateAccountsController');



// Middleware để xác thực và phân quyền
router.get('/admin_menu', authenticateToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: 'Chào admin' });
});


// API hiển thị danh sách phản hồi cho admin
router.get('/feedbacks-data', async (req, res) => {
  try {
    const feedbacks = await adminFeedbackService.getAllFeedbacks();
    res.status(200).json(feedbacks);
  } catch (err) {
    console.error('Lỗi khi truy vấn phản hồi:', err);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách phản hồi' });
  }
});

router.get('/feedbacks', (req, res) => {
  const pagePath = path.join(__dirname, '../../FrontEnd/Admin_Feedback_Manager/ad_feedback.html');
  res.sendFile(pagePath);
});

router.get('/chat/conversations', adminChatController.getAllSessions); // Lấy danh sách tất cả các cuộc trò chuyện
router.get('/chat/conversations/:session_id', adminChatController.getSessionDetails); // Lấy chi tiết cuộc trò chuyện theo session_id
router.get('/chat/students/:student_id/conversations', adminChatController.getStudentConversations); // Lấy danh sách cuộc trò chuyện của một sinh viên theo student_id

// Route API hiển thị danh sách sinh viên cho admin
router.get('/students', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const pagePath = path.join(__dirname, '../../FrontEnd/StudentList/studentlist.html'); //trả về file html
  res.sendFile(pagePath);
});
router.get('/students-data', authenticateToken, authorizeRoles('admin'), getAllStudentsForAdmin); //trả về file json để hiển thị

// Route API hiển thị danh sách giảng viên cho admin
router.get('/lecturers-data', async (req, res) => {
  try {
    const lecturers = await adminlecturerlistService.getAllLecturers();
    res.status(200).json(lecturers);
  } catch (err) {
    console.error('Lỗi khi truy vấn giảng viên:', err);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách giảng viên' });
  }
});

// API trả về giao diện quản lý giảng viên cho admin
router.get('/lecturers', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const pagePath = path.join(__dirname, '../../FrontEnd/LecturerList/lecturerlist.html');
  res.sendFile(pagePath);
});

// Route trả về giao diện tạo tài khoản giảng viên (không cần middleware nếu chỉ là file tĩnh)
router.get('/create-lecturer-account', (req, res) => {
  const pagePath = path.join(__dirname, '../../FrontEnd/Admin_Create_Lecturer_Accounts/admin_create_accounts.html');
  res.sendFile(pagePath);
});

// Route tạo tài khoản giảng viên (API)
router.post(
  '/lecturers',
  authenticateToken,
  authorizeRoles('admin'),
  createLecturer
);

module.exports = router;