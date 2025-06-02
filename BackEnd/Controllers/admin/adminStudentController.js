const Student = require('../../../Database/SaveToMongo/models/Student.js');
const Faculty = require('../../../Database/SaveToMongo/models/Faculty.js');
const AbnormalStudent = require('../../../Database/SaveToMongo/models/AbnormalStudent.js');

const getAllStudentsForAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

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
    if (req.query.class_id) query.class_id = req.query.class_id;
    if (req.query.major_id) query.major_id = req.query.major_id;
    if (req.query.faculty_name) {
      const faculty = faculties.find(f => f.faculty_name === req.query.faculty_name);
      if (faculty) query.major_id = { $in: faculty.majors };
    }

    if (req.query.status) {
      const abnormalStudents = await AbnormalStudent.find({ status: req.query.status });
      const studentIds = abnormalStudents.map(a => a.student_id);

      if (studentIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          total: 0,
          page: 1,
          pages: 0,
          filters: {
            classes: [],
            majors: [],
            faculties: [],
            statuses: await AbnormalStudent.distinct('status')
          }
        });
      }

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

    const [students, total] = await Promise.all([
      Student.find(query)
        .select('name student_id contact.school_email class_id major_id')
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(query)
    ]);

    // Ghép dữ liệu trạng thái và ghi chú từ bảng AbnormalStudent
    const abnormalMap = new Map();
    const abnormalData = await AbnormalStudent.find({ student_id: { $in: students.map(s => s.student_id) } });
    abnormalData.forEach(a => {
      abnormalMap.set(a.student_id, { status: a.status, note: a.note });
    });

    const enrichedStudents = students.map(s => {
      const abnormal = abnormalMap.get(s.student_id);
      return {
        ...s,
        faculty_name: majorToFacultyMap.get(s.major_id) || 'Không rõ',
        status: abnormal?.status || 'Đang học',
        note: abnormal?.note || '-'
      };
    });

    const statuses = await AbnormalStudent.distinct('status');
    const classNames = [...new Set(enrichedStudents.map(s => s.class_id).filter(Boolean))];
    const majorIds = [...new Set(enrichedStudents.map(s => s.major_id).filter(Boolean))];
    const facultyNames = [...new Set(enrichedStudents.map(s => s.faculty_name).filter(Boolean))];

    return res.json({
      success: true,
      data: enrichedStudents,
      total,
      page,
      pages: Math.ceil(total / limit),
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
