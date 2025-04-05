const GraduationProgressService = require('../../Services/student/graduationProgressService'); 
const GraduationProgress = require('../../../Database/SaveToMongo/models/GraduationProgress');
const Class = require('../../../Database/SaveToMongo/models/Class');
const Major = require('../../../Database/SaveToMongo/models/Major');
const Student = require('../../../Database/SaveToMongo/models/Student');

// Controller để tính toán tiến độ tốt nghiệp của sinh viên
const calculateGraduationProgressController = async (req, res) => {
    try {
        // Lấy thông tin sinh viên từ tham số trong URL (hoặc query)
        const { student_id } = req.params;

        // Kiểm tra nếu không có student_id
        if (!student_id) {
            return res.status(400).json({ message: "Student ID is required" });
        }

        // Kiểm tra xem sinh viên có tồn tại không
        const student = await Student.findOne({ student_id });
        const classes = await Class.findOne({ class_id: student.class_id });
        const major = await Major.findOne({ major_id: classes.major_id });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Tính toán tiến độ tốt nghiệp cho sinh viên
        const graduationProgress = await GraduationProgressService.updateGraduationProgress(student_id);

        // Trả kết quả về client
        return res.json({
            student_id: graduationProgress.student_id,
            has_english_certificate: student.has_english_certificate,
            graduation_progress: graduationProgress.graduation_progress,
            progress_details: graduationProgress.progress_details,
            required_progress_details: major.progress_details,
        });

    } catch (error) {
        console.error("Error in calculateGraduationProgressController:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    calculateGraduationProgressController
};
