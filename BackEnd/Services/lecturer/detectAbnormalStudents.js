const Student = require('../../../Database/SaveToMongo/models/Student');
const StudentAcademic = require('../../../Database/SaveToMongo/models/StudentAcademic');
const Semester = require('../../../Database/SaveToMongo/models/Semester');
const Enrollment = require('../../../Database/SaveToMongo/models/Enrollment');
const AbnormalStudent = require('../../../Database/SaveToMongo/models/AbnormalStudent');
const TrainingProgram = require('../../../Database/SaveToMongo/models/TrainingProgram');

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000; // 6 tháng tính bằng ms

function parseSemesterId(id) {
  // id dạng "HK120232024"
  const term = parseInt(id.slice(2, 3)); // lấy số 1 hoặc 2
  const schoolYear = id.slice(3); // lấy phần năm học "20232024"
  return { term, schoolYear };
}

function compareSemesterId(a, b) {
  const sa = parseSemesterId(a);
  const sb = parseSemesterId(b);

  // So sánh theo năm học trước
  if (sa.schoolYear < sb.schoolYear) return -1;
  if (sa.schoolYear > sb.schoolYear) return 1;

  // Năm học bằng nhau thì so sánh term (HK1 < HK2)
  return sa.term - sb.term;
}

async function detectAndSaveAbnormalStudentsByClass({class_id, student_id}) {
  const now = Date.now();
  const sixMonthsAgo = new Date(now - SIX_MONTHS_MS);

    if (!class_id && !student_id) return [];


  // 1. Kiểm tra nếu đã có dữ liệu cập nhật trong 6 tháng
  const latestRecord = await AbnormalStudent.findOne({ class_id }).sort({ updatedAt: -1 }).lean();
  if (latestRecord && latestRecord.updatedAt > sixMonthsAgo) {
    return await AbnormalStudent.find({ class_id }).lean();
  }

  if (student_id) {
    const latestRecordStudent = await AbnormalStudent.findOne({ student_id }).sort({ updatedAt: -1 }).lean();
     if (latestRecordStudent && latestRecordStudent.updatedAt > sixMonthsAgo) {
    return await AbnormalStudent.find({ student_id }).lean();
  }
  }

  // 2. Truy xuất dữ liệu đồng loạt
  const studentFilter = class_id ? { class_id } : { student_id };
  const students = await Student.find(studentFilter).lean();
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

  // Lấy danh sách các program_id cần lấy
  const programIds = [...new Set(students.map(s => s.program_id))];

  // Lấy dữ liệu chương trình đào tạo của các program_id này
  const trainingProgramsList = await TrainingProgram.find({
    program_id: { $in: programIds }
  }).lean();

  // Tạo map program_id => trainingProgram
  const trainingProgramMap = {};
  trainingProgramsList.forEach(tp => {
    trainingProgramMap[tp.program_id] = tp;
  });


  for (const student of students) {
    const academic = academicMap[student.student_id];
    const enrollmentLatest = enrollmentMap[student.student_id];
    const trainingProgram = trainingProgramMap[student.program_id];
    if (!trainingProgram) continue;

    const major = trainingProgram.majors.find(m => m.major_id === student.major_id);
    if (!major) continue;

    const limitedProgress = {};
    const keys = Object.keys(academic.progress_details);

    keys.forEach(key => {
      const requiredKey = `required_${key}`;
      if (major.progress_details.hasOwnProperty(requiredKey)) {
        limitedProgress[key] = Math.min(
          academic.progress_details[key],
          major.progress_details[requiredKey]
        );
      } else {
        limitedProgress[key] = 0;
      }
    });

    const totalEarned = Object.values(limitedProgress).reduce((sum, val) => sum + val, 0);


    if (!academic || !academic.semester_gpas?.length) {
      results.push({
        student_id: student.student_id,
        class_id: student.class_id,
        status: "Đang học",
        note: "Chưa có dữ liệu học tập"
      });
      continue;
    }

    const semester_gpas = academic.semester_gpas.sort((a, b) => compareSemesterId(a.semester_id, b.semester_id));
    const lastSemesterData = semester_gpas[semester_gpas.length - 1];
    const lastGPA = lastSemesterData.semester_gpa ?? 0;
    const lastSemesterId = lastSemesterData.semester_id;
    const cumulativeGPA = academic.cumulative_gpa ?? 0;

    const prevSemesterData = semester_gpas.length > 1 ? semester_gpas[semester_gpas.length - 2] : null;
    const prevGPA = prevSemesterData ? prevSemesterData.semester_gpa : null;

    const totalRequiredCredits = major.training_credits;

    const semestersTaken = academic.semester_gpas?.length || 0;
    const totalSemesters = 8;

    const remainingSemesters = totalSemesters - semestersTaken;
    const remainingCredits = totalRequiredCredits - totalEarned;

    const creditsRegistered = enrollmentLatest ? enrollmentLatest.credits : 0;

    const abnormalTypes = [];
    const noteLines = [];

    // Cảnh báo GPA tích lũy thấp
    if (cumulativeGPA < 2.0) {
      abnormalTypes.push('low_cumulative_gpa');
      noteLines.push(`GPA tích lũy thấp (${cumulativeGPA.toFixed(2)})`);
    }

    // Cảnh báo GPA học kỳ tụt dốc
    if (prevGPA !== null && lastGPA < prevGPA - 2) {
      abnormalTypes.push('gpa_drop');
      noteLines.push(`GPA học kỳ tụt dốc (${lastGPA.toFixed(2)} < ${prevGPA.toFixed(2)})`);
    }

    // Cảnh báo chưa đăng ký học kỳ gần nhất
    if (!enrollmentLatest || lastSemesterId !== newestSemester.semester_id) {
      abnormalTypes.push('no_enrollment');
      noteLines.push('Không đăng ký học kỳ gần nhất');
    } else {
      // Kiểm tra tín chỉ đăng ký cho học kỳ hiện tại

      // Tính tín chỉ trung bình cần đăng ký mỗi kỳ còn lại
      const avgCreditsPerSemester = remainingSemesters > 0
        ? (remainingCredits > 0 ? (remainingCredits / remainingSemesters) : 0)
        : 0;

      // Nếu đăng ký thấp hơn mức trung bình cần thiết
      if (creditsRegistered < avgCreditsPerSemester) {
        abnormalTypes.push('low_credits');
        noteLines.push(`Tín chỉ đăng ký thấp (${creditsRegistered}), cần ít nhất ${avgCreditsPerSemester.toFixed(2)} để kịp tiến độ tốt nghiệp`);
      }

      // Nếu đăng ký vượt quá 28 tín chỉ/kỳ
      if (creditsRegistered > 28) {
        abnormalTypes.push('exceed_max_credits');
        noteLines.push(`Tín chỉ đăng ký vượt mức tối đa 28 tín chỉ/kỳ (${creditsRegistered})`);
      }
    }

    // Cảnh báo sinh viên học quá số kỳ tiêu chuẩn
    if (remainingSemesters <= 0) {
      abnormalTypes.push('over_semester_limit');
      noteLines.push(`Sinh viên đã qua số học kỳ tiêu chuẩn. Số tín chỉ còn phải học: (${remainingCredits > 0 ? remainingCredits : 0})`);
    } else {
      const avgCreditsPerSemester = remainingSemesters > 0
        ? (remainingCredits > 0 ? (remainingCredits / remainingSemesters).toFixed(2) : 0)
        : 0;
      if (!abnormalTypes.includes('low_credits')) {
        noteLines.push(`Số tín chỉ trung bình mỗi kỳ cần học để đạt tiến độ tốt nghiệp: ${avgCreditsPerSemester}`);
      }
    }

    results.push({
      student_id: student.student_id,
      class_id: student.class_id,
      status: abnormalTypes.length > 0 ? "Cảnh báo" : "Đang học",
      note: noteLines.join('\n'),
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
