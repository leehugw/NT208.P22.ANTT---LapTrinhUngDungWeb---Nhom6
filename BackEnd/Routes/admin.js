// routes/admin.js
const express = require('express');
const router = express.Router();
const StudentGPAUpdateController = require('../Controllers/admin/StudentGPAUpdateController');

// Cập nhật GPA cho tất cả sinh viên
router.put('all/academicstatistic/', StudentGPAUpdateController.updateAllGPAs);

// Cập nhật GPA cho một sinh viên
router.put(':student_id/academicstatistic/', StudentGPAUpdateController.updateStudentGPA);

// Xem danh sách phản hồi
const controller = require('../controllers/adminFeedbackController');
router.get('/admin/feedbacks', controller.getAllFeedbacks);

// Lấy thông tin phản hồi
const feedbackController = require('../controllers/feedbackController');
router.post('/feedback', checkAdminAuth, feedbackController.createFeedback);
router.get('/feedbacks', checkAdminAuth, feedbackController.getAllFeedbacks);


module.exports = router;