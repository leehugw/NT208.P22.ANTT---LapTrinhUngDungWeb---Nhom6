const express = require('express');
const router = express.Router();
const path = require('path');
const StudentInformationService = require('../Services/student/StudentInformationService');
const ScoreController = require('../Controllers/student/ScoreController');
const StudentAcademicController = require('../Controllers/student/StudentAcademicController');
const HandleChatRequestController  = require('../Controllers/student/ChatBotController');


//Route lấy bản điểm của sinh viên theo học kỳ
router.get("/:studentId/group-by-semester-data", ScoreController.getScoresByStudentGrouped);

router.get("/:student_id/student-academic-data", StudentAcademicController.updateStudentAcademicController);

router.get('/:student_id/academicstatistic', (req, res) => {
    const { student_id } = req.params;
    
    if (!student_id) {
        return res.status(400).send("student_id là bắt buộc");
    }

    // Gọi controller để xử lý
    const pagePath = path.join(__dirname, '../../FrontEnd/StudyProgress/studyprogress.html');
    
    res.sendFile(pagePath);
});

//Route hien thi cau hoi va tra loi chatbot
router.post('/:student_id/chatbot-data', HandleChatRequestController.handleChatRequest);

router.get('/:student_id/chatbot', (req, res) => {
    const { student_id } = req.params;
    
    if (!student_id) {
        return res.status(400).send("student_id là bắt buộc");
    }

    // Gọi controller để xử lý
    const pagePath = path.join(__dirname, '../../FrontEnd/ChatBot/chatbot.html');
    
    res.sendFile(pagePath);
});

// Route để phục vụ trang HTML
router.get('/profile', (req, res) => {
    const { student_id } = req.query;
    
    if (!student_id) {
        return res.status(400).send("student_id là bắt buộc");
    }

    // Tạo đường dẫn đến file HTML
    const pagePath = path.join(__dirname, '../../FrontEnd/Student_Information/student_info.html');
    
    res.sendFile(pagePath);
});

// Route API để lấy dữ liệu profile
router.get('/profile-data', async (req, res) => {
    try {
        const { student_id } = req.query;
        
        if (student_id) {
            const data = await StudentInformationService.getStudentProfile(student_id);
            return res.json({ 
                success: true, 
                type: "student", 
                data 
            });
        }
        
        res.status(400).json({ 
            success: false, 
            message: "Yêu cầu không hợp lệ - cần cung cấp student_id hoặc lecturer_id" 
        });
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu profile:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Lỗi server khi xử lý yêu cầu" 
        });
    }
});

module.exports = router;