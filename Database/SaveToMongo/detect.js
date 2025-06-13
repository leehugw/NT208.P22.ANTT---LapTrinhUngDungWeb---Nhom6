const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const Semester = require("./models/Semester");
const Student = require('./models/Student');
const StudentAcademic = require('./models/StudentAcademic');
const Enrollment = require('./models/Enrollment');
const AbnormalStudent = require('./models/AbnormalStudent');

mongoose.connection.on('connected', () => {
  console.log('Mongoose event: connected');
});

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

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000; // 6 tháng tính bằng ms

async function detectAbnormalStudentsByClass(class_id) {
  console.log('--- Bắt đầu kiểm tra lớp:', class_id);

  // Truy xuất dữ liệu đồng loạt
  const students = await Student.find({ class_id }).lean();
  console.log('Danh sách sinh viên trong lớp:', students.map(s => s.student_id));
  if (students.length === 0) return [];

  const studentIds = students.map(s => s.student_id);

  const [newestSemester, academicList, enrollments] = await Promise.all([
    Semester.findOne().sort({ semester_id: -1 }).lean(),
    StudentAcademic.find({ student_id: { $in: studentIds } }).lean(),
    Enrollment.find({ student_id: { $in: studentIds } }).lean()
  ]);

  console.log('Học kỳ mới nhất:', newestSemester);

  const academicMap = {};
  academicList.forEach(a => { academicMap[a.student_id] = a; });
  console.log('Bản đồ học tập:', academicMap);

  const enrollmentMap = {};
  enrollments.forEach(e => {
    if (e.semester_id === newestSemester.semester_id) {
      enrollmentMap[e.student_id] = e;
    }
  });
  console.log('Bản đồ đăng ký học kỳ gần nhất:', enrollmentMap);

  const results = [];

  for (const student of students) {
    console.log('----- Xử lý sinh viên:', student.student_id);

    const academic = academicMap[student.student_id];
    const enrollmentLatest = enrollmentMap[student.student_id];

    if (!academic || !academic.semester_gpas?.length) {
      console.log('Chưa có dữ liệu học tập cho sinh viên này');
      results.push({
        student_id: student.student_id,
        class_id: student.class_id,
        status: "Đang học",
        note: "Chưa có dữ liệu học tập"
      });
      continue;
    }

    const semester_gpas = academic.semester_gpas.sort((a, b) => compareSemesterId(a.semester_id, b.semester_id));
    console.log(semester_gpas);
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

    const status = abnormalTypes.length > 0 ? "Cảnh báo" : "Đang học";
    const note = noteLines.join('\n');

    console.log(`Kết quả sinh viên ${student.student_id}:`, { status, note });

    results.push({
      student_id: student.student_id,
      class_id: student.class_id,
      status,
      note
    });
  }

  console.log('--- Kết quả tổng thể:', results);
  return results;
}

async function detectAllClasses() {
  // Lấy danh sách tất cả class_id duy nhất trong Student
  const classes = await Student.distinct('class_id');
  console.log('Danh sách lớp cần kiểm tra:', classes);

  for (const class_id of classes) {
    console.log(`\n=== Xử lý lớp: ${class_id} ===`);
    const results = await detectAbnormalStudentsByClass(class_id);
    console.log(`Kết quả lớp ${class_id}:`, results);
  }

  console.log('Hoàn thành kiểm tra tất cả các lớp');
}

// Gọi hàm chạy kiểm tra toàn bộ các lớp
detectAllClasses()
  .then(() => console.log('Xử lý xong tất cả các lớp'))
  .catch(err => console.error('Lỗi:', err));


async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.DB_URI);

    console.log('✅ MongoDB connected');

    const newestSemester = await Semester.findOne().sort({ semester_id: -1 }).lean();
    console.log('Tìm thấy học kỳ:', newestSemester);
    detectAbnormalStudentsNoEnrollment();

  } catch (err) {
    console.error('❌ Lỗi:', err);
  }
  // await mongoose.disconnect(); // comment tạm để test
}

run();
