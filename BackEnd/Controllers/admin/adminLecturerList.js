const Lecturer = require('../../../Database/SaveToMongo/models/Lecturer.js');

const getAllLecturersForAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    // Tạo query lọc nếu có
    const query = {};
    if (req.query.lecturer_id) query.lecturer_id = { $regex: req.query.lecturer_id, $options: 'i' };
    if (req.query.faculty) query.faculty = req.query.faculty;
    if (req.query.fullname) query.fullname = { $regex: req.query.fullname, $options: 'i' };

    // Dữ liệu giảng viên theo điều kiện lọc (dùng để hiển thị bảng)
    const lecturers = await Lecturer.find(query).select('fullname lecturer_id email phonenumber gender birthdate birthplace faculty');

    // Dữ liệu đầy đủ (không lọc) để tạo filters
    const allLecturers = await Lecturer.find().select('fullname lecturer_id faculty');
    const facultyNames = [...new Set(allLecturers.map(l => l.faculty).filter(Boolean))];
    const Names = [...new Set(allLecturers.map(l => l.fullname).filter(Boolean))];
    const Ids = [...new Set(allLecturers.map(l => l.lecturer_id).filter(Boolean))];

    res.json({
      success: true,
      data: lecturers,
      filters: {
        faculties: facultyNames,
        names: Names,
        ids: Ids
      }
    });
  } catch (err) {
    console.error("Lỗi server khi lấy danh sách giảng viên:", err);
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};


module.exports = { getAllLecturersForAdmin };
