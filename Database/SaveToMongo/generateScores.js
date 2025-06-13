const mongoose = require('mongoose');
const Student = require("./models/Student");
const Subject = require("./models/Subject");
const Enrollment = require("./models/Enrollment");
const Score = require("./models/Score");

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Kết nối MongoDB
mongoose.connect(process.env.DB_URI, {})
  .then(() => {
    console.log('✅ MongoDB connected');
    generateScores();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });

function calcRealSemesterNum(studentId, semesterId) {
  if (!studentId || studentId.length < 2 || !semesterId.startsWith("HK")) {
    return null;
  }
  const startYear = 2000 + parseInt(studentId.substring(0, 2));
  const semesterYear = parseInt(semesterId.substring(3, 7));
  const hk = parseInt(semesterId[2]);
  return (semesterYear - startYear) * 2 + hk;
}

function randomScore() {
  const r = Math.random();
  if (r < 0.1) return parseFloat((Math.random() * 4).toFixed(1));         // 0.0 - 4.0 (10%)
  if (r < 0.3) return parseFloat((Math.random() * 2 + 4).toFixed(1));     // 4.0 - 6.0 (20%)
  return parseFloat((Math.random() * 3 + 7).toFixed(1));                  // 7.0 - 10.0 (70%)
}

// Hàm chính tạo điểm số
async function generateScores() {
  try {
    const students = await Student.find({}, {student_id: 1, has_english_certificate: 1});
    const subjects = await Subject.find({}, {subject_id: 1, practice_credits: 1});
    const enrollments = await Enrollment.find({}, {student_id: 1, semester_id: 1, subject_ids: 1});

    console.log(`Tổng số enrollment: ${enrollments.length}`); // Debug

    // Tạo lookup tables
    const studentLookup = {};
    students.forEach(s => studentLookup[s.student_id] = s);
    
    const subjectLookup = {};
    subjects.forEach(s => subjectLookup[s.subject_id] = s);

    const specialSubjects = new Set(["PE231", "PE232", "PE012"]);
    const scores = [];

    // Tạo index lịch sử điểm theo sinh viên
    const existingScoresByStudent = {};
    const existingScores = await Score.find({}, { student_id: 1, subject_id: 1, semester_num: 1, status: 1 });

    for (const s of existingScores) {
      if (!existingScoresByStudent[s.student_id]) {
        existingScoresByStudent[s.student_id] = [];
      }
      existingScoresByStudent[s.student_id].push({
        subject_id: s.subject_id,
        semester_num: parseInt(s.semester_num),
        status: s.status
      });
    }

    // Xử lý từng enrollment
    for (const enrollment of enrollments) {
      const studentId = enrollment.student_id;
      const semesterId = enrollment.semester_id;
      
      if (!studentId || !semesterId) {
        console.warn(`Enrollment thiếu student_id hoặc semester_id: ${enrollment._id}`);
        continue;
      }

      const semesterNum = calcRealSemesterNum(studentId, semesterId);
      const student = studentLookup[studentId];

      if (!student) {
        console.warn(`Không tìm thấy student với id: ${studentId}`);
        continue;
      }

      // Kiểm tra và xử lý subject_ids
      if (!enrollment.subject_ids || enrollment.subject_ids.length === 0) {
        console.warn(`Enrollment ${enrollment._id} không có môn học`);
        continue;
      }

      for (const subjectId of enrollment.subject_ids) {
        if (!subjectId) continue;

        const subject = subjectLookup[subjectId];
        if (!subject) {
          console.warn(`Không tìm thấy subject với id: ${subjectId}`);
          continue;
        }

        const hasPractice = subject.practice_credits > 0;
        const isEnglish = subjectId.toUpperCase().includes("ENG");
        const isExempt = isEnglish && student.has_english_certificate;
        const isSpecial = specialSubjects.has(subjectId);
        // Tính lại isRetaken đúng nghĩa học lại (đã từng học trước đó)
        let isRetaken = false;
        const prevScores = existingScoresByStudent[studentId] || [];
        const alreadyFailed = prevScores.some(ps =>
          ps.subject_id === subjectId &&
          ps.semester_num < semesterNum &&
          ps.status === "Rớt"
        );
        isRetaken = alreadyFailed;

        // Tạo điểm số
        let scoreQT, scoreGK, scoreTH, scoreCK, scoreHP, status;

        if (isExempt) {
          scoreHP = "Miễn";
          status = "Đậu";
          scoreQT = null;
          scoreGK = null;
          scoreTH = null;
          scoreCK = null;
        } else {
          // Tạo điểm ngẫu nhiên
          if (isSpecial) {
            scoreQT = randomScore();
            scoreGK = randomScore();
            scoreTH = hasPractice ? randomScore() : null;
            scoreCK = randomScore();
          } else {
            scoreQT = randomScore();
            scoreGK = randomScore();
            scoreTH = hasPractice ? randomScore() : null;
            scoreCK = randomScore();
          }

          // Tính điểm HP và status
          if (scoreQT === null || scoreGK === null || scoreCK === null || 
              (hasPractice && scoreTH === null)) {
            status = "None";
            scoreHP = null;
          } else {
            const avg = hasPractice 
              ? scoreQT * 0.2 + scoreGK * 0.3 + scoreTH * 0.2 + scoreCK * 0.3
              : scoreQT * 0.2 + scoreGK * 0.3 + scoreCK * 0.5;
            
            status = avg >= 5.0 ? "Đậu" : "Rớt";
            scoreHP = status !== "None" ? avg.toFixed(1) : null;
          }
        }

        scores.push({
          student_id: studentId,
          subject_id: subjectId,
          semester_id: semesterId,
          score_QT: scoreQT,
          score_GK: scoreGK,
          score_TH: scoreTH,
          score_CK: scoreCK,
          score_HP: scoreHP.toString(),
          semester_num: semesterNum?.toString(),
          isRetaken: isRetaken,
          status: status
        });
      }
    }

    // Xóa dữ liệu cũ và chèn dữ liệu mới
    await mongoose.connection.dropCollection('scores'); // Xóa hoàn toàn collection cũ
    await Score.insertMany(scores);
    
    console.log(`✅ Đã tạo ${scores.length} bản ghi điểm số`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Lỗi khi tạo điểm số:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}