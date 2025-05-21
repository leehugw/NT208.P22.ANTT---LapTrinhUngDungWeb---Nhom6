const ScoreService = require("../../Services/student/ScoreService");
const Class = require("../../../Database/SaveToMongo/models/Classes");
const Student = require("../../../Database/SaveToMongo/models/Student");


const getScoresByStudentGrouped = async (req, res) => {
    try {
        const userRole = req.user.role;
        let student_id;

        // Nếu là sinh viên, chỉ được xem điểm của chính mình
        if (userRole === 'student') {
            student_id = req.user.student_id; // Sinh viên lấy student_id từ req.user
        }
        // Nếu là giảng viên
        else if (userRole === 'lecturer' || userRole === 'admin') {
            // Nếu là giảng viên, lấy student_id từ URL
            student_id = req.query.student_id;

            // Kiểm tra xem sinh viên có tồn tại không
            const student = await Student.findOne({ student_id });
            if (!student) {
                return res.status(404).json({ message: "Sinh viên không tồn tại" });
            }

        } else {
            // Trường hợp không phải sinh viên hoặc giảng viên
            return res.status(403).json({ message: "Không có quyền truy cập" });
        }

        // Lấy danh sách điểm theo nhóm môn học
        const scores = await ScoreService.getScoresByStudentGrouped(student_id);
        return res.json(scores);

    } catch (error) {
        console.error("Lỗi controller:", error);
        return res.status(500).json({ message: "Lỗi server" });
    }
};

module.exports = {
  getScoresByStudentGrouped
};

