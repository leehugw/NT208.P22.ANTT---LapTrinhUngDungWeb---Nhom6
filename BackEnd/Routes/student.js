const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');


const { generateOptimizedScheduleFromExcel } = require('../Services/student/ScheduleService');
const StudentInformationService = require('../Services/student/StudentInformationService');
const ScoreController = require('../Controllers/student/ScoreController');
const StudentAcademicController = require('../Controllers/student/StudentAcademicController');
//const HandleChatRequestController  = require('../Controllers/student/ChatBotController');

const CourseRecommendationService = require('../Services/student/CourseRecommendationService');

// Cấu hình multer với validation
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.xlsx' && ext !== '.xls') {
            return cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
        }
        cb(null, true);
    }
});

// Route lấy bản điểm
router.get("/:studentId/group-by-semester-data", ScoreController.getScoresByStudentGrouped);

// Route thông tin học tập
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
// router.post('/:student_id/chatbot-data', HandleChatRequestController.handleChatRequest);

// router.get('/:student_id/chatbot', (req, res) => {
//     const { student_id } = req.params;

//     if (!student_id) {
//         return res.status(400).send("student_id là bắt buộc");
//     }

//     // Gọi controller để xử lý
//     const pagePath = path.join(__dirname, '../../FrontEnd/ChatBot/chatbot.html');

//     res.sendFile(pagePath);
// });

// router.get('/:student_id/chatbot', (req, res) => {
//     const { student_id } = req.params;

//     if (!student_id) {
//         return res.status(400).send("student_id là bắt buộc");
//     }

//     // Gọi controller để xử lý
//     const pagePath = path.join(__dirname, '../../FrontEnd/ChatBot/chatbot.html');

//     res.sendFile(pagePath);
// });

// API hợp nhất: tạo lịch học tối ưu từ dữ liệu và file Excel
router.post('/:studentId/schedule-fixed',
    upload.single('file'),
    CourseRecommendationService.getFixedSchedule
);
// API hợp nhất: tạo lịch học tối ưu từ dữ liệu và file Excel
router.post('/:studentId/schedule-optimize',
    upload.single('file'),
    CourseRecommendationService.generateOptimizedSchedule
);

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