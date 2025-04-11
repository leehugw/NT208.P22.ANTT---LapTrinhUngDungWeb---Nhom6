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
router.get('/profile', (req, res) => {
    const { lecturer_id } = req.query;
    
    if (!lecturer_id) {
        return res.status(400).send("lecturer_id là bắt buộc");
    }

    // Tạo đường dẫn đến file HTML
    const pagePath = path.join(__dirname, '../../FrontEnd/Lecturer_Information/lecturer_info.html');
    
    res.sendFile(pagePath);
});

// Route API để lấy dữ liệu profile
router.get('/profile-data', async (req, res) => {
    try {
        const { lecturer_id } = req.query;
        
        if (lecturer_id) {
            const data = await LecturerInformationService.getLecturerProfile(lecturer_id);
            return res.json({ 
                success: true, 
                type: "lecturer", 
                data 
            });
        }
        
        res.status(400).json({ 
            success: false, 
            message: "Yêu cầu không hợp lệ - cần cung cấp lecturer_id" 
        });
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu profile:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Lỗi server khi xử lý yêu cầu" 
        });
    }
});

//Giảng viên gửi phản hồi
router.post('/feedback', LectureFeedbackController.createFeedback);

module.exports = router;