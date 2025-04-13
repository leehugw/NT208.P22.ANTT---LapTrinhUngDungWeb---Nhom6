const Score = require('../../../Database/SaveToMongo/models/Score');
const Class = require('../../../Database/SaveToMongo/models/Classes');
const Semester = require('../../../Database/SaveToMongo/models/Semester');
const Student = require('../../../Database/SaveToMongo/models/Student');

exports.getSemestersByLecturer = async (lecturerId) => {
  const classList = await Class.find({ lecturer_id: String(lecturerId) });
  const semesterIds = [...new Set(classList.map(c => c.semester_id))];
  const semesters = await Semester.find({ semester_id: { $in: semesterIds } });
  return semesters;
};

exports.getClassesBySemester = async (lecturerId, semesterId) => {
  return await Class.find({ lecturer_id: lecturerId, semester_id: semesterId });
};

exports.getStudentsByClass = async (classId) => {
  const classData = await Class.findOne({ class_id: classId });
  const studentIds = classData.students;

  console.log("Class Data:", classData);

  const students = await Student.find({ student_id: { $in: studentIds } });

  // Lấy tất cả điểm hiện có của các sinh viên trong lớp
  let scores = await Score.find({
    student_id: { $in: studentIds },
    subject_id: classData.subject_id,
    semester_id: classData.semester_id
  });

  // Tạo map nhanh để kiểm tra ai đã có điểm
  const scoreMap = {};
  scores.forEach(score => {
    scoreMap[score.student_id] = score;
  });

  // Khởi tạo điểm cho những sinh viên chưa có
  const missingScores = [];

  for (let student of students) {
    if (!scoreMap[student.student_id]) {
      const newScore = new Score({
        student_id: student.student_id,
        subject_id: classData.subject_id,
        semester_id: classData.semester_id,
        score_QT: null,
        score_GK: null,
        score_TH: null,
        score_CK: null,
        score_HP: "",
        status: "None"
      });

      await newScore.save();
      scoreMap[student.student_id] = newScore;
      missingScores.push(newScore);
    }
  }

  // Gộp cả những điểm vừa tạo vào danh sách tổng
  scores = [...scores, ...missingScores];

  return students.map(student => {
    const score = scoreMap[student.student_id] || {};
    return {
      student_id: student.student_id,
      name: student.name,
      email: student.email,
      subject_id: classData.subject_id,
      score_QT: score.score_QT,
      score_GK: score.score_GK,
      score_TH: score.score_TH,
      score_CK: score.score_CK,
      score_HP: score.score_HP,
      status: score.status || "None"
    };
  });
};


exports.updateOrCreateScore = async (data) => {
  const { student_id, subject_id, semester_id } = data;

  let score = await Score.findOne({ student_id, subject_id, semester_id });

  if (!score) {
    score = new Score({
      student_id,
      subject_id,
      semester_id,
      score_QT: null,
      score_GK: null,
      score_TH: null,
      score_CK: null,
      score_HP: "",
      status: "None"
    });
  }

  // Cập nhật field được gửi lên
  for (let key of Object.keys(data)) {
    if (key.startsWith("score_") || key === "status") {
      score[key] = data[key];
    }
  }

  await score.save();
  return score;
};


