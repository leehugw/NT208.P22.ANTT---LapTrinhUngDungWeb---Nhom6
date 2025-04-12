// routes/admin.js
const express = require('express');
const path = require('path');
const router = express.Router();
const adminFeedbackService = require('../Services/admin/adminFeedbackService');
const { authenticateToken, authorizeRoles } = require('../Middleware/auth');
const adminChatController = require('../Controllers/admin/adminChatController');

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

module.exports = router;