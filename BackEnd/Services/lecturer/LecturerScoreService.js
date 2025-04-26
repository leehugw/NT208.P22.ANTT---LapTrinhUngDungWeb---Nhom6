const Score = require('../../../Database/SaveToMongo/models/Score');
const Class = require('../../../Database/SaveToMongo/models/Classes');
const Semester = require('../../../Database/SaveToMongo/models/Semester');
const Student = require('../../../Database/SaveToMongo/models/Student');
const Faculty = require('../../../Database/SaveToMongo/models/Faculty');
const TrainingProgram = require('../../../Database/SaveToMongo/models/TrainingProgram');

exports.getSemestersByLecturer = async (lecturerId) => {
  const classList = await Class.find({ lecturer_id: String(lecturerId) });
  const semesterIds = [...new Set(classList.map(c => c.semester_id))];
  const semesters = await Semester.find({ semester_id: { $in: semesterIds } });
  return semesters;
};

exports.getClasses = async (lecturerId, semesterId) => {
  let classes;

  if (semesterId) {
    // Nếu có semesterId, lấy lớp giảng viên dạy trong học kỳ đó
    const teachingClasses = await Class.find({
      lecturer_id: lecturerId,
      semester_id: semesterId
    });

    // Lấy lớp mà giảng viên là cố vấn (không cần học kỳ)
    const advisingClasses = await Class.find({
      advisorLecturerId: lecturerId
    });

    // Gộp lại và loại trùng
    const classMap = {};
    [...teachingClasses, ...advisingClasses].forEach(cls => {
      classMap[cls.class_id] = cls;
    });

    classes = Object.values(classMap);
  } else {
    // Nếu không có semesterId, lấy tất cả lớp mà giảng viên tham gia (dạy hoặc cố vấn)
    classes = await Class.find({
      $or: [
        { lecturer_id: lecturerId },
        { advisorLecturerId: lecturerId }
      ]
    });
  }

  return classes;
};


exports.getStudentsByClass = async (classId) => {
  const classData = await Class.findOne({ class_id: classId });

  // Check nếu là lớp chủ nhiệm
  const isAdvisorClass = await Student.exists({ class_id: classId });

  if (isAdvisorClass) {
    const students = await Student.find({ class_id: classId });

    if (students.length === 0) return [];

    // Lấy major_id đầu tiên để tra ngành và khoa
    const program = await TrainingProgram.findOne({ program_id: students[0].program_id });
    if (!program) return null;

    const major = program.majors.find(m => m.major_id === students[0].major_id);
    if (!major) return null;

    let faculty = null; 

    if (students[0].major_id) {
      // Tìm tất cả các khoa có chứa major_id của sinh viên
      const faculties = await Faculty.find({
        $or: [
          { majors: students[0].major_id },       // Tìm trong mảng majors
        ]
      }).lean();

      // Lấy khoa đầu tiên tìm thấy 
      faculty = faculties[0];
    }

    return {
      isAdvisorClass: true,
      students: students.map(student => ({
        student_id: student.student_id,
        name: student.name,
        school_email: student.contact?.school_email || "",
        class_name: student.class_name,
        major_name: major?.major_name || "N/A",
        faculty_name: faculty?.faculty_name || "N/A"
      }))
    };
    
  }
  else {
    // Lớp học phần → giữ nguyên logic cũ
    studentIds = classData.students;
    students = await Student.find({ student_id: { $in: studentIds } });

    let scores = await Score.find({
      student_id: { $in: studentIds },
      subject_id: classData.subject_id,
      semester_id: classData.semester_id
    });

    const scoreMap = {};
    scores.forEach(score => {
      scoreMap[score.student_id] = score;
    });

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

    scores = [...scores, ...missingScores];

    return {
      isAdvisorClass: false,
      students: students.map(student => {
        const score = scoreMap[student.student_id] || {};
        return {
          student_id: student.student_id,
          name: student.name,
          school_email: student.contact?.school_email || "",
          subject_id: classData.subject_id,
          semester_id: classData.semester_id,
          score_QT: score.score_QT,
          score_GK: score.score_GK,
          score_TH: score.score_TH,
          score_CK: score.score_CK,
          score_HP: score.score_HP,
          status: score.status || "None"
        };
      })
    };    
  }
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


