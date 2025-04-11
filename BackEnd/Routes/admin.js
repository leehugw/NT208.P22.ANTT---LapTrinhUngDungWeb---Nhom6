// routes/admin.js
const express = require('express');
const router = express.Router();
const adminFeedbackService = require('../Services/admin/adminFeedbackService');
const { authenticateToken, authorizeRoles } = require('../Middleware/auth');

// Middleware để xác thực và phân quyền
router.get('/admin_menu', authenticateToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: 'Chào admin' });
});


// API hiển thị danh sách phản hồi cho admin
router.get('/feedbacks', async (req, res) => {
    try {
      const feedbacks = await adminFeedbackService.getAllFeedbacks();
      res.status(200).json(feedbacks);
    } catch (err) {
      console.error('Lỗi khi truy vấn phản hồi:', err);
      res.status(500).json({ error: 'Lỗi server khi lấy danh sách phản hồi' });
    }
  });


module.exports = router;