const express = require('express');
const router = express.Router();
const path = require('path');

const LecturerInformationService = require('../Services/lecturer/LecturerInformationService');
const LecturerScoreController = require('../Controllers/lecturer/LecturerScoreController');
const { authenticateToken, authorizeRoles } = require('../Middleware/auth');

// Middleware để xác thực và phân quyền
router.get('/lec_menu', authenticateToken, authorizeRoles('lecturer'), (req, res) => {
    res.json({ message: 'Chào giảng viên' });
});

// Route để phục vụ trang HTML
router.get('/profile', authenticateToken, authorizeRoles('lecturer'), (req, res) => {
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
router.get('/profile/api', authenticateToken, authorizeRoles('lecturer'), async (req, res) => {
    try {
        if (!req.user?.lecturer_id) {
            return res.status(403).json({
                success: false,
                message: "Không có quyền truy cập"
            });
        }
        
        const profile = await LecturerInformationService.getLecturerProfile(req.user.lecturer_id);
        res.json({ 
            success: true, 
            type: "lecturer",
            data: profile 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

module.exports = router;