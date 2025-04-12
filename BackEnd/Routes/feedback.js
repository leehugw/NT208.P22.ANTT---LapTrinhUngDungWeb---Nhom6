const express = require('express');
const router = express.Router();
const path = require('path');
const FeedbackController = require('../Controllers/feedback/feedbackController');

// Route nhận phản hồi và trả lại kết quả
router.post('/feedbacks-form', FeedbackController.createFeedback);

module.exports = router;