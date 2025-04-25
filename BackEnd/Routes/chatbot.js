const express = require('express');
const router = express.Router();
const { chatbotGetTuitionFee } = require('../Controllers/chatbot/chatbotGetTuitionFeeController');

router.get('/tuition-fee/:academic_year/:cohort', chatbotGetTuitionFee);

module.exports = router;