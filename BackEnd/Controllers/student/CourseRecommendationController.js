const CourseRecommendationService = require('../../Services/student/CourseRecommendationService');

exports.generateOptimizedSchedule = async (req, res) => {
    try {
        const { availableCourses } = req.body;
        const studentId = req.user.student_id;

        if (!Array.isArray(availableCourses) || availableCourses.length === 0) {
            return res.status(400).json({ error: 'availableCourses is missing or empty' });
        }

        const result = await CourseRecommendationService.generateOptimizedSchedule(
            studentId,
            availableCourses
        );
        res.json(result);
    } catch (error) {
        console.error('Generate Schedule Error:', error);
        res.status(500).json({ error: error.message });
    }
};
