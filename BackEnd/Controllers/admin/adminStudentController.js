const student = require('../../../Database/SaveToMongo/models/Student.js');
const Faculty = require('../../../Database/SaveToMongo/models/Faculty.js');

const getAllStudentsForAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    const faculties = await Faculty.find().select('faculty_name majors');
    const majorToFacultyMap = new Map();
    faculties.forEach(fac => {
      fac.majors.forEach(m => {
        majorToFacultyMap.set(m, fac.faculty_name);
      });
    });

    const query = {};
    if (req.query.student_id) query.student_id = { $regex: req.query.student_id, $options: 'i' };
    if (req.query.class_name) query.class_name = req.query.class_name;
    if (req.query.major_id) query.major_id = req.query.major_id;
    if (req.query.faculty_name) {
      const faculty = faculties.find(f => f.faculty_name === req.query.faculty_name);
      if (faculty) query.major_id = { $in: faculty.majors };
    }

    const students = await student.find(query).select('name student_id contact.school_email class_name major_id');
    const enrichedStudents = students.map(s => ({
      ...s.toObject(),
      faculty_name: majorToFacultyMap.get(s.major_id) || 'Không rõ'
    }));

    const classNames = [...new Set(enrichedStudents.map(s => s.class_name).filter(Boolean))];
    const majorIds = [...new Set(enrichedStudents.map(s => s.major_id).filter(Boolean))];
    const facultyNames = [...new Set(enrichedStudents.map(s => s.faculty_name).filter(Boolean))];

    res.json({
      success: true,
      data: enrichedStudents,
      filters: {
        classes: classNames,
        majors: majorIds,
        faculties: facultyNames
      }
    });

  } catch (err) {
    console.error("Lỗi server khi lấy danh sách sinh viên:", err);
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

module.exports = { getAllStudentsForAdmin };
