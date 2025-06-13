const Score = require('../../../Database/SaveToMongo/models/Score');
const Class = require('../../../Database/SaveToMongo/models/Classes');
const Semester = require('../../../Database/SaveToMongo/models/Semester');
const Student = require('../../../Database/SaveToMongo/models/Student');
const Faculty = require('../../../Database/SaveToMongo/models/Faculty');
const TrainingProgram = require('../../../Database/SaveToMongo/models/TrainingProgram');
const AcademicProgress = require('../../../Database/SaveToMongo/models/StudentAcademic')
const Lecturer = require('../../../Database/SaveToMongo/models/Lecturer');
const Enrollment = require('../../../Database/SaveToMongo/models/Enrollment')


exports.getSemestersByLecturer = async (lecturerId) => {
  const classList = await Class.find({ lecturer_id: String(lecturerId) });
  const semesterIds = [...new Set(classList.map(c => c.semester_id))];
  const semesters = await Semester.find({ semester_id: { $in: semesterIds } });
  return semesters;
};

exports.getClasses = async (lecturerId, semesterId) => {
  const lecturer = await Lecturer.findOne({ lecturer_id: lecturerId });

  if (!lecturer) {
    return []; // Không tìm thấy giảng viên
  }

  let teachingClasses = [];
  if (semesterId) {
    teachingClasses = await Class.find({
      lecturer_id: lecturerId,
      semester_id: semesterId
    });
  } else {
    teachingClasses = await Class.find({ lecturer_id: lecturerId });
  }

  let advisingClasses = [];
  if (lecturer.class_id) {
    const advisorClass = await Class.findOne({ class_id: lecturer.class_id });
    if (advisorClass) {
      advisingClasses.push(advisorClass);
    }
  }

  // Gộp lại, loại trùng
  const classMap = new Map();
  [...teachingClasses, ...advisingClasses].forEach(cls => {
    classMap.set(cls.class_id, cls);
  });

  return Array.from(classMap.values());
};

exports.getStudentsByClass = async (classId, semesterId = null) => {
  let studentIds;
  let students;

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

    const studentIds = students.map(s => s.student_id);
    const academicRecords = await AcademicProgress.find({ student_id: { $in: studentIds } });

    // Nếu chưa truyền semesterId → lấy học kỳ hiện tại
    let activeSemesterId = semesterId;
    if (!semesterId) {
      const today = new Date();
      const allSemesters = await Semester.find({});
      const activeSemester = allSemesters.find(s => {
        const start = new Date(s.start_date);
        const end = new Date(s.end_date);
        return start <= today && end >= today;
      });

      if (activeSemester) activeSemesterId = activeSemester.semester_id;
    }

    // Lấy số tín chỉ đăng ký học kỳ hiện tại nếu có
    const enrollmentRecords = activeSemesterId
      ? await Enrollment.find({ student_id: { $in: studentIds }, semester_id: activeSemesterId })
      : [];

    const studentsWithStats = students.map(student => {
      const academic = academicRecords.find(a => a.student_id === student.student_id);
      const enrollment = enrollmentRecords.find(e => e.student_id === student.student_id);

      const semesterGpas = academic?.semester_gpas || [];
      const sortedSemesters = [...semesterGpas].sort((a, b) => b.semester_id.localeCompare(a.semester_id));
      const currentGpa = sortedSemesters[0]?.semester_gpa ?? null;
      const previousGpa = sortedSemesters[1]?.semester_gpa ?? null;

      const gpa_diff = (currentGpa != null && previousGpa != null)
        ? (currentGpa - previousGpa).toFixed(2)
        : null;

      const studentInfo = {
        student_id: student.student_id,
        name: student.name,
        school_email: student.contact?.school_email || "",
        class_id: student.class_id,
        major_name: major?.major_name || "N/A",
        faculty_name: faculty?.faculty_name || "N/A",
        gpa: academic?.gpa ?? null,
        credits: academic?.total_credits_earned ?? 0,
        gpa_diff: gpa_diff
      };

      if (activeSemesterId) {
        studentInfo.credits_this_semester = enrollment?.credits ?? 0;
        studentInfo.semester_id = activeSemesterId;
      }

      return studentInfo;
    });

    return {
      isAdvisorClass: true,
      students: studentsWithStats
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


