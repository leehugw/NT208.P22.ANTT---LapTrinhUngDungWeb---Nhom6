const express = require('express');
const router = express.Router();
const path = require('path');
const StudentInformationService = require('../Services/student/StudentInformationService');

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

module.exports = router;