// routes/admin.js
const express = require('express');
const router = express.Router();
const StudentGPAUpdateController = require('../Controllers/admin/StudentGPAUpdateController');

// Cập nhật GPA cho tất cả sinh viên
router.put('all/academicstatistic/', StudentGPAUpdateController.updateAllGPAs);

// Cập nhật GPA cho một sinh viên
router.put(':student_id/academicstatistic/', StudentGPAUpdateController.updateStudentGPA);

module.exports = router;