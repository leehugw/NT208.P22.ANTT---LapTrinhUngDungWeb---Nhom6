const Score = require('../../Database/SaveToMongo/models/Score');

// Map semester_num và năm học
const semesterMap = [
  { year: '2021-2022', semester: 'HK1', semester_num: '1' },
  { year: '2021-2022', semester: 'HK2', semester_num: '2' },
  { year: '2022-2023', semester: 'HK1', semester_num: '3' },
  { year: '2022-2023', semester: 'HK2', semester_num: '4' },
  { year: '2023-2024', semester: 'HK1', semester_num: '5' },
  { year: '2023-2024', semester: 'HK2', semester_num: '6' },
  { year: '2024-2025', semester: 'HK1', semester_num: '7' },
  { year: '2024-2025', semester: 'HK2', semester_num: '8' },
];

exports.getAverageGPABySemester = async (req, res) => {
  try {
    const results = [];
    for (const sem of semesterMap) {
      // Lấy tất cả điểm học phần (score_HP) của học sinh trong học kỳ này
      const scores = await Score.find({ semester_num: sem.semester_num, score_HP: { $ne: null } });
      // Chuyển score_HP sang số (nếu là string)
      const numericScores = scores
        .map(s => parseFloat(s.score_HP))
        .filter(val => !isNaN(val));
      // Tính trung bình
      const avgGPA = numericScores.length
        ? (numericScores.reduce((a, b) => a + b, 0) / numericScores.length).toFixed(2)
        : null;
      results.push({
        year: sem.year,
        semester: sem.semester,
        avgGPA: avgGPA ? Number(avgGPA) : null,
        count: numericScores.length
      });
    }
    res.json(results);
  } catch (err) {
    console.error('Lỗi khi tính GPA:', err);
    res.status(500).json({ error: 'Lỗi server khi tính GPA' });
  }
};