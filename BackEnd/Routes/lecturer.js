const express = require('express');
const router = express.Router();
const path = require('path');

const LecturerInformationService = require('../Services/lecturer/LecturerInformationService');
const LectureFeedbackController = require('../Controllers/feedback/feedbackController');
const { authenticateToken, authorizeRoles } = require('../Middleware/auth');

// Middleware để xác thực và phân quyền
router.get('/lec_menu', authenticateToken, authorizeRoles('lecturer'), (req, res) => {
    res.json({ message: 'Chào giảng viên' });
});

// Route để phục vụ trang HTML
router.get('/profile', authenticateToken, authorizeRoles('lecturer'), (req, res) => {
    res.sendFile(path.join(__dirname, '../../FrontEnd/Lecturer_Information/lecturer_info.html'));
});

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

//Giảng viên gửi phản hồi
router.post('/feedback', LectureFeedbackController.createFeedback);

module.exports = router;