const Student = require('../../../Database/SaveToMongo/models/Student.js');
const Faculty = require('../../../Database/SaveToMongo/models/Faculty.js');
const AbnormalStudent = require('../../../Database/SaveToMongo/models/AbnormalStudent.js');

const getAllStudentsForAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    // Lấy faculties và map major -> faculty
    const faculties = await Faculty.find().select('faculty_name majors');
    const majorToFacultyMap = new Map();
    faculties.forEach(fac => {
      fac.majors.forEach(m => {
        majorToFacultyMap.set(m, fac.faculty_name);
      });
    });

    // Build query filter cho students
    const query = {};
    if (req.query.student_id) query.student_id = { $regex: req.query.student_id, $options: 'i' };
    if (req.query.class_id) query.class_id = req.query.class_id;
    if (req.query.major_id) query.major_id = req.query.major_id;
    if (req.query.faculty_name) {
      const faculty = faculties.find(f => f.faculty_name === req.query.faculty_name);
      if (faculty) query.major_id = { $in: faculty.majors };
    }

    // Lọc theo status nếu có
    if (req.query.status) {
      // Tìm student_id có status tương ứng trong AbnormalStudent
      const abnormalStudents = await AbnormalStudent.find({ status: req.query.status }).select('student_id');
      const studentIds = abnormalStudents.map(a => a.student_id);

      if (studentIds.length === 0) {
        // Nếu không có student nào thỏa điều kiện status, trả về rỗng luôn
        return res.json({
          success: true,
          data: [],
          filters: {
            classes: [],
            majors: [],
            faculties: [],
            statuses: await AbnormalStudent.distinct('status')
          }
        });
      }

      // Nếu đã có filter student_id trước đó (ví dụ từ student_id regex), kết hợp filter
      if (query.student_id) {
        query.$and = [
          { student_id: query.student_id },
          { student_id: { $in: studentIds } }
        ];
        delete query.student_id;
      } else {
        query.student_id = { $in: studentIds };
      }
    }

    // Lấy danh sách students với query đã build
    const students = await Student.find(query).select('name student_id contact.school_email class_id major_id');

    const enrichedStudents = students.map(s => ({
      ...s.toObject(),
      faculty_name: majorToFacultyMap.get(s.major_id) || 'Không rõ'
    }));

    // Lấy filter status từ bảng AbnormalStudent
    const statuses = await AbnormalStudent.distinct('status');

    const classNames = [...new Set(enrichedStudents.map(s => s.class_id).filter(Boolean))];
    const majorIds = [...new Set(enrichedStudents.map(s => s.major_id).filter(Boolean))];
    const facultyNames = [...new Set(enrichedStudents.map(s => s.faculty_name).filter(Boolean))];

    // Trả dữ liệu + filter
    return res.json({
      success: true,
      data: enrichedStudents,
      filters: {
        classes: classNames,
        majors: majorIds,
        faculties: facultyNames,
        statuses: statuses
      }
    });

  } catch (err) {
    console.error("Lỗi server khi lấy danh sách sinh viên:", err);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

module.exports = { getAllStudentsForAdmin };

