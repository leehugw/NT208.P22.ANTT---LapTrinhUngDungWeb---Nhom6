const express = require('express');
const router = express.Router();
const path = require('path');
const StudentInformationService = require('../Services/student/StudentInformationService');
const ScoreController = require('../Controllers/student/ScoreController');
const StudentAcademicController = require('../Controllers/student/StudentAcademicController');
const { authenticateToken, authorizeRoles } = require('../Middleware/auth');
const HandleChatRequestController = require('../Controllers/student/ChatBotController');
const chatController = require('../Controllers/student/studentChatController');
const RecommendCourseController = require('../Controllers/student/RecommendCourseController');

// Middleware để xác thực và phân quyền
router.get('/stu_menu', authenticateToken, authorizeRoles('student'), (req, res) => {
    res.json({ message: 'Chào sinh viên hoặc giảng viên' });
});

//Route lấy bản điểm của sinh viên theo học kỳ
router.get("/group-by-semester-data", authenticateToken,
    authorizeRoles('student'), ScoreController.getScoresByStudentGrouped);

router.get("/student-academic-data", authenticateToken,
    authorizeRoles('student'), StudentAcademicController.updateStudentAcademicController);

router.get('/academicstatistic', authenticateToken, authorizeRoles('student'), (req, res) => {
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
router.get('/profile', authenticateToken, authorizeRoles('student'), (req, res) => {
    res.sendFile(path.join(__dirname, '../../FrontEnd/Student_Information/student_info.html'));
});

// Route API để lấy dữ liệu sinh viên
router.get('/profile/api', authenticateToken, authorizeRoles('student'), async (req, res) => {
    try {
        if (!req.user?.student_id) {
            return res.status(403).json({
                success: false,
                message: "Không có quyền truy cập"
            });
        }

        const profile = await StudentInformationService.getStudentProfile(req.user.student_id);
        res.json({
            success: true,
            type: "student",
            data: profile
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

// Routes chatbot conversation
router.post('/conversation', chatController.createConversation); // Tạo conversation mới
router.post('/conversation/:session_id/messages', chatController.addMessage); // Thêm message
router.get('/conversation/:session_id', chatController.getChatHistory); // Lấy lịch sử chat

// Route để sinh viên truy cập vào chatbot
router.get('/chatbot', authenticateToken, authorizeRoles('student'), (req, res) => {
    res.sendFile(path.join(__dirname, '../../FrontEnd/UI_ChatBot/UI_ChatBot.html'));
});

// Route gợi ý môn học cho sinh viên
router.get('/recommend-courses', authenticateToken, authorizeRoles('student'), RecommendCourseController.getRecommendedCourses );

module.exports = router;