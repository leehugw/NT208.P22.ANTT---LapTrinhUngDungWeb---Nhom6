const LecturerInformationService = require('../../Services/lecturer/LecturerInformationService');

class LecturerInformationController {
  static async getProfile(req, res) {
    try {
      const { lecturer_id } = req.query;
      
      if (!lecturer_id) {
        return res.status(400).json({ 
          success: false,
          message: "Vui lòng cung cấp lecturer_id" 
        });
      }

      const profile = await LecturerInformationService.getLecturerProfile(lecturer_id);
      
      return res.json({
        success: true,
        type: "lecturer",
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

module.exports = LecturerInformationController;