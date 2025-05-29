const Student = require('../../../Database/SaveToMongo/models/Student');
const StudentAcademic = require('../../../Database/SaveToMongo/models/StudentAcademic');
const Semester = require('../../../Database/SaveToMongo/models/Semester');
const Enrollment = require('../../../Database/SaveToMongo/models/Enrollment');
const AbnormalStudent = require('../../../Database/SaveToMongo/models/AbnormalStudent');

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000; // 6 tháng tính bằng ms

async function detectAndSaveAbnormalStudentsByClass(class_id) {
  // Kiểm tra xem có dữ liệu cập nhật trong 6 tháng gần đây không
  const now = Date.now();
  const sixMonthsAgo = new Date(now - SIX_MONTHS_MS);

  // Tìm 1 bản ghi abnormal trong class này cập nhật gần nhất
  const latestRecord = await AbnormalStudent.findOne({ class_id }).sort({ updatedAt: -1 });

  if (latestRecord && latestRecord.updatedAt > sixMonthsAgo) {
    // Dữ liệu mới, lấy từ db luôn, không tính lại
    const cachedResults = await AbnormalStudent.find({ class_id });
    return cachedResults;
  }

  // Nếu không có dữ liệu hoặc đã cũ, tính lại rồi lưu mới

  const students = await Student.find({ class_id });
  const newestSemester = await Semester.findOne().sort({ start_time: -1 });
  const results = [];

  for (const student of students) {
    const academic = await StudentAcademic.findOne({ student_id: student.student_id });
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
    const lastSemesterId = lastSemesterData.semester_id;
    const lastGPA = lastSemesterData.semester_gpa ?? 0;
    const cumulativeGPA = academic.cumulative_gpa ?? 0;

    const prevSemesterData = semester_gpas.length > 1 ? semester_gpas[semester_gpas.length - 2] : null;
    const prevGPA = prevSemesterData ? prevSemesterData.semester_gpa : null;

    const enrollmentLatest = await Enrollment.findOne({
      student_id: student.student_id,
      semester_id: newestSemester.semester_id
    });

    const creditsRegistered = enrollmentLatest ? enrollmentLatest.credits : 0;

    let abnormalTypes = [];
    let noteLines = [];

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

    const abnormalStudentData = {
      student_id: student.student_id,
      class_id: student.class_id,
      status: abnormalTypes.length > 0 ? "Cảnh báo" : "Đang học",
      note: noteLines.join('\n')
    };

    results.push(abnormalStudentData);

    await AbnormalStudent.findOneAndUpdate(
      { student_id: student.student_id },
      abnormalStudentData,
      { upsert: true, new: true }
    );
  }

  return results;
}

module.exports = {
  detectAndSaveAbnormalStudentsByClass
};
