const ScoreService = require("../../Services/student/ScoreService");

async function getScoresByStudentGrouped(req, res) {
    try {
      const student_id = req.user.student_id;
      const scores = await ScoreService.getScoresByStudentGrouped(student_id);
      res.json(scores);
    } catch (error) {
      console.error("Lỗi controller:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  }
  
  module.exports = {
    getScoresByStudentGrouped
  };

