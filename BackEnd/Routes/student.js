const express = require('express');
const router = express.Router();
const StudentGPAViewController = require('../Controllers/student/StudentGPAViewController');

// Lấy thông tin GPA của một sinh viên
router.get('/academicstatistic/:student_id', StudentGPAViewController.getStudentGPA);

module.exports = router;