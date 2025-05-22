// StudentInformationController.js
const StudentInformationService = require('../../Services/student/StudentInformationService');
const Student = require("../../../Database/SaveToMongo/models/Student");
const User = require("../../../Database/SaveToMongo/models/Users");



const ViewStudentInformation = async (req, res) => {
  try {
    {
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

      const profile = await StudentInformationService.getStudentProfile(student_id);

      return res.json({
        success: true,
        type: "student",
        data: profile
      });
    }
  } catch (error) {
    console.error('Lỗi ', error);
    return res.status(500).json({ message: 'Đã xảy ra lỗi.', error: error.message });
  }
}


module.exports = { ViewStudentInformation };