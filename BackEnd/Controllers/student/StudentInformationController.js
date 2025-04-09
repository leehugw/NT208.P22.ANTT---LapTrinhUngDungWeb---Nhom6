// StudentInformationController.js
const StudentInformationService = require('../../Services/student/StudentInformationService');

class StudentInformationController {
  static async getProfile(req, res) {
    try {
      const { student_id } = req.query;
      
      if (!student_id) {
        return res.status(400).json({ 
          success: false,
          message: "Vui lòng cung cấp student_id" 
        });
      }

      const profile = await StudentInformationService.getStudentProfile(student_id);
      
      return res.json({
        success: true,
        type: "student",
        data: profile
      });
    } catch (error) {
      console.error("Lỗi server:", error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Lỗi server",
        error: error.message 
      });
    }
  }
}

module.exports = StudentInformationController;