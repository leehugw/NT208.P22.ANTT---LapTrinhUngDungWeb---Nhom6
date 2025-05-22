const { updateStudentAcademic } = require('../../Services/student/StudentAcademicService');
const Student = require('../../../Database/SaveToMongo/models/Student');
const User = require('../../../Database/SaveToMongo/models/Users');
const TrainingProgram = require('../../../Database/SaveToMongo/models/TrainingProgram');
const Class = require('../../../Database/SaveToMongo/models/Classes');


const updateStudentAcademicController = async (req, res) => {
    try {
        const userRole = req.user.role; // Lấy role của người dùng (giảng viên hoặc sinh viên)
        let student_id;

        // Kiểm tra quyền của người dùng
        if (userRole === 'student') {
            // Nếu là sinh viên, lấy student_id từ req.user (vì sinh viên chỉ có thể xem thông tin của chính mình)
            student_id = req.user.student_id; 
        } else if (userRole === 'lecturer' || userRole === 'admin') {
            // Nếu là giảng viên or admin, lấy student_id từ URL (có thể là sinh viên khác)
            student_id = req.query.student_id;
            
        } else {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền truy cập vào thông tin này"
            });
        }

        // Tìm thông tin sinh viên
        const student = await Student.findOne({ student_id });
        if (!student) {
            return res.status(404).json({ message: "Sinh viên không tồn tại" });
        }

        // Tìm thông tin người dùng (User)
        const user = await User.findOne({ student_id });
        if (!user) {
            return res.status(404).json({ message: "Người dùng không tồn tại" });
        }

        // Tìm chương trình đào tạo của sinh viên
        const program = await TrainingProgram.findOne({ program_id: student.program_id });
        if (!program) {
            return res.status(404).json({ message: "Chương trình đào tạo không tồn tại" });
        }

        // Tìm ngành học trong chương trình đào tạo
        const major = program.majors.find(major => major.major_id === student.major_id);
        if (!major) {
            return res.status(404).json({ message: "Ngành học không tồn tại trong chương trình đào tạo" });
        }

        // Cập nhật thông tin học tập cho sinh viên
        const result = await updateStudentAcademic(student_id);
        return res.status(200).json({
            user_gmail: user.username,
            student_name: student.name,
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
