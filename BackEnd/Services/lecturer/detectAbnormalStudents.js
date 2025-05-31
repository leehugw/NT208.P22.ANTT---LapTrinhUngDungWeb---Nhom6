const Student = require('../../../Database/SaveToMongo/models/Student');
const StudentAcademic = require('../../../Database/SaveToMongo/models/StudentAcademic');
const Semester = require('../../../Database/SaveToMongo/models/Semester');
const Enrollment = require('../../../Database/SaveToMongo/models/Enrollment');
const AbnormalStudent = require('../../../Database/SaveToMongo/models/AbnormalStudent');

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000; // 6 tháng tính bằng ms

async function detectAndSaveAbnormalStudentsByClass(class_id) {
  const now = Date.now();
  const sixMonthsAgo = new Date(now - SIX_MONTHS_MS);

  // 1. Kiểm tra nếu đã có dữ liệu cập nhật trong 6 tháng
  const latestRecord = await AbnormalStudent.findOne({ class_id }).sort({ updatedAt: -1 }).lean();
  if (latestRecord && latestRecord.updatedAt > sixMonthsAgo) {
    return await AbnormalStudent.find({ class_id }).lean();
  }

  // 2. Truy xuất dữ liệu đồng loạt
  const students = await Student.find({ class_id }).lean();
  if (students.length === 0) return [];

  const studentIds = students.map(s => s.student_id);

  const [newestSemester, academicList, enrollments] = await Promise.all([
    Semester.findOne().sort({ semester_id: -1 }).lean(),
    StudentAcademic.find({ student_id: { $in: studentIds } }).lean(),
    Enrollment.find({ student_id: { $in: studentIds } }).lean()
  ]);

  const academicMap = {};
  academicList.forEach(a => { academicMap[a.student_id] = a; });

  const enrollmentMap = {};
  enrollments.forEach(e => {
    if (e.semester_id === newestSemester.semester_id) {
      enrollmentMap[e.student_id] = e;
    }
  });

  const results = [];

  for (const student of students) {
    const academic = academicMap[student.student_id];
    const enrollmentLatest = enrollmentMap[student.student_id];

    if (!academic || !academic.semester_gpas?.length) {
      results.push({
        student_id: student.student_id,
        class_id: student.class_id,
        status: "Đang học",
        note: "Chưa có dữ liệu học tập"
      });
      continue;
    }

    const semester_gpas = academic.semester_gpas;
    const lastSemesterData = semester_gpas[semester_gpas.length - 1];
    const lastGPA = lastSemesterData.semester_gpa ?? 0;
    const lastSemesterId = lastSemesterData.semester_id;
    const cumulativeGPA = academic.cumulative_gpa ?? 0;

    const prevSemesterData = semester_gpas.length > 1 ? semester_gpas[semester_gpas.length - 2] : null;
    const prevGPA = prevSemesterData ? prevSemesterData.semester_gpa : null;

    const creditsRegistered = enrollmentLatest ? enrollmentLatest.credits : 0;

    const abnormalTypes = [];
    const noteLines = [];

    if (cumulativeGPA < 2.0) {
      abnormalTypes.push('low_cumulative_gpa');
      noteLines.push(`GPA tích lũy thấp (${cumulativeGPA.toFixed(2)})`);
    }

    if (prevGPA !== null && lastGPA < prevGPA - 2) {
      abnormalTypes.push('gpa_drop');
      noteLines.push(`GPA học kỳ tụt dốc (${lastGPA.toFixed(2)} < ${prevGPA.toFixed(2)})`);
    }

    if (creditsRegistered < 14) {
      abnormalTypes.push('low_credits');
      noteLines.push(`Tín chỉ đăng ký thấp (${creditsRegistered})`);
    }

    if (!enrollmentLatest || lastSemesterId !== newestSemester.semester_id) {
      abnormalTypes.push('no_enrollment');
      noteLines.push('Không đăng ký học kỳ gần nhất');
    }

    results.push({
      student_id: student.student_id,
      class_id: student.class_id,
      status: abnormalTypes.length > 0 ? "Cảnh báo" : "Đang học",
      note: noteLines.join('\n')
    });
  }

  // 3. Ghi dữ liệu đồng loạt vào database
  const bulkOps = results.map(data => ({
    updateOne: {
      filter: { student_id: data.student_id },
      update: { $set: data },
      upsert: true
    }
  }));
  if (bulkOps.length > 0) {
    await AbnormalStudent.bulkWrite(bulkOps);
  }

  return results;
}

module.exports = {
  detectAndSaveAbnormalStudentsByClass
};
