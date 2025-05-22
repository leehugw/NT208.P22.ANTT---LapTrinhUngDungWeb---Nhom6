// routes/admin.js
const express = require('express');
const path = require('path');
const router = express.Router();
const adminFeedbackService = require('../Services/admin/adminFeedbackService');
const { authenticateToken, authorizeRoles } = require('../Middleware/auth');
const adminChatController = require('../Controllers/admin/adminChatController');
const { getAllLecturersForAdmin } = require('../Controllers/admin/adminLecturerList');
const { getAllStudentsForAdmin } = require('../Controllers/admin/adminStudentController');
const { createLecturer } = require('../Controllers/admin/adminCreateAccountsController');
const StudentInformationService = require('../Services/student/StudentInformationService');
const { getHomeVisitCount } = require('../Controllers/admin/HomeStatisticsController');
const { getTopPopularSubjects } = require('../Controllers/admin/SubjectStatistic');
const LecturerAbnormalDetectionController = require('../Controllers/lecturer/detectAbnormalStudent');
const { authorize } = require('passport');
const { fetchSemesterGPAStatistics } = require('../Controllers/admin/GPAStatisticsController');
const Feedback = require('../../Database/SaveToMongo/models/Feedback');


router.get('/semester-gpa-statistics', authenticateToken, authorizeRoles('admin'), fetchSemesterGPAStatistics);

router.get('/top-popular-subjects', authenticateToken, authorizeRoles('admin'), getTopPopularSubjects);

// Middleware để xác thực và phân quyền
router.get('/admin_menu', authenticateToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: 'Chào admin' });
});

// API hiển thị danh sách phản hồi cho admin
router.get('/feedbacks-data', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const feedbacks = await adminFeedbackService.getAllFeedbacks();
    res.status(200).json(feedbacks);
  } catch (err) {
    console.error('Lỗi khi truy vấn phản hồi:', err);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách phản hồi' });
  }
});


router.get('/feedbacks', (req, res) => {
  const pagePath = path.join(__dirname, '../../FrontEnd/Admin_Feedback_Manager/ad_feedback.html');
  res.sendFile(pagePath);
});

router.get('/chat/conversations', adminChatController.getAllSessions); // Lấy danh sách tất cả các cuộc trò chuyện
router.get('/chat/conversations/:session_id', adminChatController.getSessionDetails); // Lấy chi tiết cuộc trò chuyện theo session_id
router.get('/chat/students/:student_id/conversations', adminChatController.getStudentConversations); // Lấy danh sách cuộc trò chuyện của một sinh viên theo student_id



// Route API hiển thị danh sách sinh viên cho admin
router.get('/students', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const pagePath = path.join(__dirname, '../../FrontEnd/StudentList/studentlist.html'); //trả về file html
  res.sendFile(pagePath);
});

router.get('/students-data', authenticateToken, authorizeRoles('admin'), getAllStudentsForAdmin); //trả về file json để hiển thị

// Route API hiển thị danh sách giảng viên cho admin
router.get('/lecturers', (req, res) => {
  const pagePath = path.join(__dirname, '../../FrontEnd/LecturerList/lecturerlist.html'); //trả về file html
  res.sendFile(pagePath);
});
router.get('/lecturers-data', authenticateToken, authorizeRoles('admin'), getAllLecturersForAdmin); //trả về file json để hiển thị

router.get('/abnormal/:class_id', authenticateToken, authorizeRoles('admin'), LecturerAbnormalDetectionController.getAbnormalStudentsByClass);

// Route trả về giao diện tạo tài khoản giảng viên (không cần middleware nếu chỉ là file tĩnh)
router.get('/create-lecturer-account', (req, res) => {
  const pagePath = path.join(__dirname, '../../FrontEnd/Admin_Create_Lecturer_Accounts/admin_create_accounts.html');
  res.sendFile(pagePath);
});

// Route tạo tài khoản giảng viên (API)
router.post(
  '/lecturers',
  authenticateToken,
  authorizeRoles('admin'),
  createLecturer
);

router.get('/home-visit-count', getHomeVisitCount);

router.get('/statistics', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const pagePath = path.join(__dirname, '../../FrontEnd/Admin_Statistics/admin_statistics.html');
  res.sendFile(pagePath);
});

// Route đếm số lượt phản hồi về lỗi (bug)
router.get('/bug-statistic', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const bugCount = await Feedback.countDocuments({ type: 'bug' });
    res.status(200).json({ bugCount });
  } catch (err) {
    console.error('Lỗi thống kê bug:', err);
    res.status(500).json({ error: 'Lỗi server khi thống kê lỗi' });
  }
});

module.exports = router;