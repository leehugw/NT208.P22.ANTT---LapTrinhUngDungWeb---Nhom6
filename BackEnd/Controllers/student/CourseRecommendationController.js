const CourseRecommendationService = require('../../Services/student/CourseRecommendationService');

exports.generateOptimizedSchedule = async (req, res) => {
    try {
        const result = await CourseRecommendationService.generateOptimizedSchedule(
            req.params.studentId, 
            req.file.path
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};