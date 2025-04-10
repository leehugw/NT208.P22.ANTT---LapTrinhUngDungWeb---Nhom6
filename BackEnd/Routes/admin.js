// routes/admin.js
const express = require('express');
const router = express.Router();
const StudentGPAUpdateController = require('../Controllers/admin/StudentGPAUpdateController');
const adminFeedbackService = require('../Services/admin/adminFeedbackService');

// Cập nhật GPA cho tất cả sinh viên
router.put('all/academicstatistic/', StudentGPAUpdateController.updateAllGPAs);

// Cập nhật GPA cho một sinh viên
router.put(':student_id/academicstatistic/', StudentGPAUpdateController.updateStudentGPA);

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