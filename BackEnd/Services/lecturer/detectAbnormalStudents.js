const Student = require('../../../Database/SaveToMongo/models/Student');
const StudentAcademic = require('../../../Database/SaveToMongo/models/StudentAcademic');
const Semester = require('../../../Database/SaveToMongo/models/Semester');
const Enrollment = require('../../../Database/SaveToMongo/models/Enrollment');

async function detectAbnormalStudentsByClass(class_id) {
  const students = await Student.find({ class_id });
  const newestSemester = await Semester.findOne().sort({ start_time: -1 });
  const results = [];

  for (const student of students) {
    const academic = await StudentAcademic.findOne({ student_id: student.student_id });
    if (!academic || !academic.semester_gpas || academic.semester_gpas.length === 0) {
      // Không có dữ liệu học tập
      results.push({
        student_id: student.student_id,
        class_id: student.class_id,
        status: "Đang học",
        note: "Chưa có dữ liệu học tập"
      });
      continue;
    }

    // GPA học kỳ gần nhất
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

    // Phát hiện bất thường
    let abnormalTypes = [];
    let note = '';

    let noteLines = [];

    if (cumulativeGPA < 2.0) {
      abnormalTypes.push('low_cumulative_gpa');
      noteLines.push(`GPA tích lũy thấp (${cumulativeGPA.toFixed(2)})`);
    }
    
    if (prevGPA !== null && lastGPA < prevGPA - 0.5) {
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

  return results;
}

module.exports = {
  detectAbnormalStudentsByClass
};
