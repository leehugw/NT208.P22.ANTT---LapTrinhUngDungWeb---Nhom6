const CourseRecommendationService = require('../../Services/student/CourseRecommendationService');

exports.getRecommendedCourses = async (req, res) => {
    try {
        const result = await CourseRecommendationService.getOptimizedSchedule(req, res);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.generateOptimizedCourseSchedule = async (req, res) => {
    try {
        const result = await CourseRecommendationService.generateOptimizedScheduleFromExcel(
            req.params.studentId, 
            req.file.path
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};