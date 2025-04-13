const scoreService = require("../../Services/lecturer/LecturerScoreService");

exports.getSemestersByLecturer = async (req, res) => {
  const lecturerId = req.user.lecturer_id;
  try {
    const semesters = await scoreService.getSemestersByLecturer(lecturerId);
    res.json(semesters);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách học kỳ:", err);  // <== in lỗi
    res.status(500).json({ message: err.message });
  }
};

exports.getClassesBySemester = async (req, res) => {
  const { semester_id } = req.query;
  const lecturerId = req.user.lecturer_id;
  try {
    const classes = await scoreService.getClassesBySemester(lecturerId, semester_id);
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentsByClass = async (req, res) => {
  const { classId } = req.params;
  try {
    const students = await scoreService.getStudentsByClass(classId);
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateScore = async (req, res) => {
  try {
    const updated = await scoreService.updateOrCreateScore(req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


