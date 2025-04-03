// routes/admin.js
const express = require('express');
const router = express.Router();
const StudentGPAUpdateController = require('../Controllers/admin/StudentGPAUpdateController');

// Cập nhật GPA cho tất cả sinh viên
router.put('/academicstatistic/all', StudentGPAUpdateController.updateAllGPAs);

// Cập nhật GPA cho một sinh viên
router.put('/academicstatistic/:student_id', StudentGPAUpdateController.updateStudentGPA);

module.exports = router;