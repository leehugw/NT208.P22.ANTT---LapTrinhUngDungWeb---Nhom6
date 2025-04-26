const express = require('express');
const router = express.Router();
const { chatbotGetTuitionFee } = require('../Controllers/chatbot/chatbotGetTuitionFeeController');
const TrainingScheduleController = require('../Controllers/chatbot/TrainingScheduleController');

router.get('/tuition-fee/:academic_year/:cohort', chatbotGetTuitionFee);

router.get('/trainingschedule', TrainingScheduleController.getAllTrainingSchedules);

// Lấy TrainingSchedule theo academicYear
router.get('/trainingschedule/:academicYear', TrainingScheduleController.getTrainingScheduleByAcademicYear);

module.exports = router;