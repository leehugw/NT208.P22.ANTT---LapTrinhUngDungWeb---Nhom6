const express = require('express');
const router = express.Router();
const path = require('path');
const StudentInformationController = require('../Controllers/student/StudentInformationController');
const ScoreController = require('../Controllers/student/ScoreController');
const StudentAcademicController = require('../Controllers/student/StudentAcademicController');
const { authenticateToken, authorizeRoles } = require('../Middleware/auth');
const HandleChatRequestController = require('../Controllers/student/ChatBotController');
const chatController = require('../Controllers/student/studentChatController');
const RecommendCourseController = require('../Controllers/student/RecommendCourseController');
const CourseRecommendationController = require('../Controllers/student/CourseRecommendationController');
const EnglishCertificateController = require('../Controllers/student/EnglishCertificateController');
const { GetSession } = require('../Controllers/student/ChatBot_GetSession');
const { AddNewSessions } = require('../Controllers/student/ChatBotNewSession');
const { GetChatHistory } = require('../Controllers/student/ChatHistory');
const { AddMessages } = require('../Controllers/student/ChatBot_addMess');
const detectAbnormalController = require('../Controllers/student/detectAbnormal');
const notificationController = require('../Controllers/student/NotificationController');

// Middleware để xác thực và phân quyền
router.get('/stu_menu', authenticateToken, authorizeRoles('student'), (req, res) => {
    res.json({ message: 'Chào sinh viên' });
});

// Route lấy bản điểm của sinh viên theo học kỳ 
router.get("/group-by-semester-data", authenticateToken,
    authorizeRoles('student', 'lecturer', 'admin'), ScoreController.getScoresByStudentGrouped);

// Route cập nhật thông tin học tập của sinh viên 
router.get("/student-academic-data", authenticateToken,
    authorizeRoles('student', 'lecturer', 'admin'), StudentAcademicController.updateStudentAcademicController);

// Route xem thống kê học tập 
router.get('/academicstatistic', (req, res) => {
    const { student_id } = req.query; // Lấy student_id từ params nếu có
    const pagePath = path.join(__dirname, '../../FrontEnd/StudyProgress/studyprogress.html');
    res.sendFile(pagePath);
});

// Route nộp chứng chỉ
router.get('/english-certificate', (req, res) => {
    const { student_id } = req.query;
    const pagePath = path.join(__dirname, '../../FrontEnd/Submit_English_Certificate/student_english_certificate.html');
    res.sendFile(pagePath);
});

//Route hien thi cau hoi va tra loi chatbot
 router.post('/chatbot-data', authenticateToken, HandleChatRequestController.handleChatRequest);


// API hợp nhất: tạo lịch học tối ưu từ dữ liệu và file Excel
router.post('/schedule-optimize-data', authenticateToken, authorizeRoles('student'), CourseRecommendationController.generateOptimizedSchedule
);

router.get('/schedule-optimize', (req, res) => {
    const pagePath = path.join(__dirname, '../../FrontEnd/Timetable/Timetable.html');

    res.sendFile(pagePath);
});

router.get('/abnormal', authenticateToken, authorizeRoles('student'), detectAbnormalController.getAbnormalStudentsByStudentId);


// Route để phục vụ trang HTML
router.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../../FrontEnd/Student_Information/student_info.html'));
});

// Route API để lấy dữ liệu sinh viên
router.get('/profile-data', authenticateToken, authorizeRoles('student', 'lecturer', 'admin'), StudentInformationController.ViewStudentInformation);


// Routes chatbot conversation
router.post('/conversation', chatController.createConversation); // Tạo conversation mới
router.post('/conversation/:session_id/messages', chatController.addMessage); // Thêm message
router.get('/conversation/:session_id', chatController.getChatHistory); // Lấy lịch sử chat

// Route để sinh viên truy cập vào chatbot
router.get('/chatbot', (req, res) => {
    res.sendFile(path.join(__dirname, '../../FrontEnd/UI_ChatBot/UI_ChatBot.html'));
});

// Route gợi ý môn học cho sinh viên
router.get('/recommend-courses', authenticateToken, authorizeRoles('student'), RecommendCourseController.getRecommendedCourses);

// POST chứng chỉ Anh văn
router.post('/certificate', EnglishCertificateController.submitCertificate);

// GET danh sách chứng chỉ đã nộp
router.get('/certificate', EnglishCertificateController.getStudentCertificates);

// Tạo session mới
router.post('/chat-sessions', authenticateToken, AddNewSessions);

// Lấy danh sách session
router.get('/chat-sessions', authenticateToken, GetChatHistory);

// Lấy chi tiết session
router.get('/chat-sessions/:sessionId', authenticateToken, GetSession);

// Thêm tin nhắn vào session
router.post('/chat-sessions/:sessionId/messages', authenticateToken, AddMessages);

router.put('/notifications/mark-read', authenticateToken, authorizeRoles('student'), notificationController.markNotificationsRead);

module.exports = router;