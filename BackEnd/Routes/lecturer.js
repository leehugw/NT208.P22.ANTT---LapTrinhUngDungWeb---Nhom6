const express = require('express');
const router = express.Router();
const path = require('path');

const LecturerInformationController = require('../Controllers/lecturer/LecturerInformationController');
const LecturerScoreController = require('../Controllers/lecturer/LecturerScoreController');
const LecturerAbnormalDetectionController = require('../Controllers/lecturer/detectAbnormalStudent');
const { authenticateToken, authorizeRoles } = require('../Middleware/auth');
const LecturerClassStatisticController = require('../Controllers/lecturer/LecturerClassStatisticController');

// Middleware để xác thực và phân quyền
router.get('/lec_menu', authenticateToken, authorizeRoles('lecturer'), (req, res) => {
    res.json({ message: 'Chào giảng viên' });
});

// Route để phục vụ trang HTML
router.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../../FrontEnd/Lecturer_Information/lecturer_info.html'));
});

router.get('/classlist', (req, res) => {
    res.sendFile(path.join(__dirname, '../../FrontEnd/Class_List/classlist.html'));
});

// Lấy danh sách học kỳ giảng viên có dạy
router.get("/semesters", authenticateToken, authorizeRoles('lecturer'), LecturerScoreController.getSemestersByLecturer);

// Lấy danh sách lớp học giảng viên dạy trong 1 học kỳ
router.get("/classes", authenticateToken, authorizeRoles('lecturer'), LecturerScoreController.getClasses);

// Lấy danh sách sinh viên trong lớp + điểm
router.get("/classes/:classId/students", authenticateToken, authorizeRoles('lecturer'), LecturerScoreController.getStudentsByClass);

// Cập nhật hoặc tạo điểm
router.put("/update/scores", authenticateToken, authorizeRoles('lecturer'), LecturerScoreController.updateScore);

// Route API để lấy dữ liệu profile
router.get('/profile-data', authenticateToken, authorizeRoles('lecturer', 'admin'), LecturerInformationController.getProfile);

router.get('/abnormal/:class_id', authenticateToken, authorizeRoles('lecturer'), LecturerAbnormalDetectionController.getAbnormalStudentsByClass);

// Route API để lấy dữ liệu thống kê lớp
router.get('/classstatistic', (req, res) => {
    res.sendFile(path.join(__dirname, '../../FrontEnd/LecturerClassStatistic/lecturerClassStatistic.html'));
});
router.get('/classes/:classId/statistics', authenticateToken, authorizeRoles('lecturer'), LecturerClassStatisticController.getClassStatisticByClassId);

module.exports = router;