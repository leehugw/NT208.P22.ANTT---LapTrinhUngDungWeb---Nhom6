const express = require('express');
const router = express.Router();
const path = require('path');
const LecturerInformationService = require('../Services/lecturer/LecturerInformationService');

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

module.exports = router;