const ScoreService = require("../../Services/student/ScoreService");

async function getScoresByStudentGrouped(req, res) {
    try {
      const studentId = req.params.studentId;
      const scores = await ScoreService.getScoresByStudentGrouped(studentId);
      res.json(scores);
    } catch (error) {
      console.error("Lỗi controller:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  }
  
  module.exports = {
    getScoresByStudentGrouped
  };

