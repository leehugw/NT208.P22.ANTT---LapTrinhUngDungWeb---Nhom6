const { updateStudentAcademic } = require('../../Services/student/StudentAcademicService');
const Student = require('../../../Database/SaveToMongo/models/Student');
const TrainingProgram = require('../../../Database/SaveToMongo/models/TrainingProgram');


const updateStudentAcademicController = async (req, res) => {
    try {
        const student_id = req.params.student_id || req.body.student_id;
        if (!student_id) {
            return res.status(400).json({ message: 'student_id là bắt buộc.' });
        }

        const student = await Student.findOne({ student_id });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Find the program using student.program_id and the major using student.major_id
        const program = await TrainingProgram.findOne({ program_id: student.program_id });
        if (!program) {
            return res.status(404).json({ message: "Program not found" });
        }

        // Find the major in the program
        const major = program.majors.find(major => major.major_id === student.major_id);
        if (!major) {
            return res.status(404).json({ message: "Major not found in the program" });
        }

        const result = await updateStudentAcademic(student_id);
        return res.status(200).json({
            has_english_certificate: student.has_english_certificate,
            required_progress_details: major.progress_details,
            data: result
        });

    } catch (error) {
        console.error('Lỗi khi cập nhật học tập:', error);
        return res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật thông tin học tập.', error: error.message });
    }
};

module.exports = { updateStudentAcademicController };
