const { getSemesterGPAStatistics } = require("../../Services/admin/GPAStatisticsService");

const fetchSemesterGPAStatistics = async (req, res) => {
  try {
    const stats = await getSemesterGPAStatistics();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê GPA:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

module.exports = {
  fetchSemesterGPAStatistics
};
