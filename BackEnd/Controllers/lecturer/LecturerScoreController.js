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

exports.getClasses = async (req, res) => {
  const { semester_id } = req.query;
  const lecturerId = req.user.lecturer_id; // Lấy lecturer_id từ thông tin người dùng đã xác thực

  try {
    // Gọi service để lấy danh sách lớp mà giảng viên dạy hoặc cố vấn
    const classes = await scoreService.getClasses(lecturerId, semester_id);

    // Trả kết quả về cho người dùng
    res.json(classes);
  } catch (err) {
    // Xử lý lỗi và trả về thông báo lỗi
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentsByClass = async (req, res) => {
  const { classId } = req.params;
  const { semester_id } = req.query; // nếu có truy vấn thêm

  try {
    const studentsData = await scoreService.getStudentsByClass(classId, semester_id);

    if (!studentsData) {
      return res.status(404).json({ message: "Không tìm thấy lớp hoặc dữ liệu sinh viên" });
    }

    res.json(studentsData);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách sinh viên:", err); // In ra lỗi
    res.status(500).json({ message: "Lỗi máy chủ" });
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


