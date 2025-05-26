const mongoose = require("mongoose");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Semester = require("../models/Semester");
const Enrollment = require("../models/Enrollment");
const Faculty = require("../models/Faculty");
const TrainingProgram = require("../models/TrainingProgram");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

async function generateEnrollments() {
  try {
    await mongoose.connect(process.env.DB_URI, {});
    console.log("✅ MongoDB connected");

    const students = await Student.find();
    const subjects = await Subject.find();
    const faculties = await Faculty.find();
    const semesters = await Semester.find().sort({ start_date: 1 });
    const programs = await TrainingProgram.find();

    if (!students.length || !subjects.length || !semesters.length || !faculties.length || !programs.length) {
      console.error("❌ Thiếu dữ liệu Student / Subject / Semester / Faculty / TrainingProgram");
      return;
    }

    const letters = ["A", "B", "C", "D"];
    const minNumber = 20;
    const maxNumber = Math.floor(Math.random() * 3) + 20; // 20 - 22
    const suffixes = [];
    for (const letter of letters) {
      for (let num = minNumber; num <= maxNumber; num++) {
        suffixes.push(`${letter}${num}`);
      }
    }

    const classMap = new Map();
    const enrollments = [];

    const facultyPDTDH = "KHOA_PĐTĐH";
    const facultyBMTL = "KHOA_BMTL";
    const facultyAV = "KHOA_TTNN";

    const startSemesterMap = {
      "20": "HK120202021",
      "21": "HK120212022",
      "22": "HK120222023",
      "23": "HK120232024",
      "24": "HK120242025"
    };

    const sortSubjects = (subjectsToSort) => {
      const typeOrder = ['CSN', 'CSNN', 'ĐC', 'CN', 'CNTC', 'TN', 'TTTN'];
      return subjectsToSort.sort((a, b) => {
        const typeCompare = typeOrder.indexOf(a.subject_type) - typeOrder.indexOf(b.subject_type);
        if (typeCompare !== 0) return typeCompare;

        if (a.subject_type === 'ĐC' && b.subject_type === 'ĐC') {
          const priorityFaculties = [facultyPDTDH, facultyBMTL, facultyAV];
          const isAPriority = priorityFaculties.includes(a.faculty_id) ? 0 : 1;
          const isBPriority = priorityFaculties.includes(b.faculty_id) ? 0 : 1;
          return isAPriority - isBPriority;
        }

        return 0;
      });
    };

    for (const student of students) {
      const facultyOfStudent = faculties.find(faculty => faculty.majors.includes(student.major_id));
      if (!facultyOfStudent) {
        console.warn(`Không tìm thấy Faculty chứa major_id ${student.major_id} của sinh viên ${student.student_id}`);
        continue;
      }

      const trainingProgram = programs.find(p =>
        p.program_id === student.program_id
      );
      if (!trainingProgram) {
        console.warn(`Không tìm thấy chương trình đào tạo cho sinh viên ${student.student_id}`);
        continue;
      }

      const majorData = trainingProgram.majors.find(m => m.major_id === student.major_id);
      if (!majorData) {
        console.warn(`Không tìm thấy ngành học ${student.major_id} trong CTĐT của sinh viên ${student.student_id}`);
        continue;
      }

      const requiredCoursesSet = new Set(majorData.required_courses);

      const preferredFacultyIds = [facultyPDTDH, facultyBMTL, facultyAV, facultyOfStudent.faculty_id];

      const requiredSubjects = sortSubjects(subjects.filter(sub => requiredCoursesSet.has(sub.subject_id)));
      const otherSubjects = sortSubjects(subjects.filter(sub =>
        preferredFacultyIds.includes(sub.faculty_id) && !requiredCoursesSet.has(sub.subject_id)
      ));

      const subjectsOfStudent = [...requiredSubjects, ...otherSubjects];

      const studentYearPrefix = student.student_id.toString().substring(0, 2);
      const startSemesterId = startSemesterMap[studentYearPrefix];
      if (!startSemesterId) {
        console.warn(`Không xác định được học kỳ bắt đầu cho sinh viên ${student.student_id}`);
        continue;
      }

      const startIndex = semesters.findIndex(s => s.semester_id === startSemesterId);
      if (startIndex === -1) {
        console.warn(`Không tìm thấy học kỳ bắt đầu ${startSemesterId} cho sinh viên ${student.student_id}`);
        continue;
      }

      const selectedSemesters = semesters.slice(startIndex);
      const subjectRepetitionCount = {};
      const allLearnedSubjects = new Set();

      for (const semester of selectedSemesters) {
        const shuffledSubjects = [...subjectsOfStudent].sort(() => 0.5 - Math.random());

        const selectedSubjects = [];
        const classIds = [];
        let totalCredits = 0;
        const creditLimit = Math.floor(Math.random() * 29);

        for (const subject of shuffledSubjects) {
          if ((subject.theory_credits + subject.practice_credits) === 0) continue;

          const prerequisitesRaw = subject.prerequisite_id || [];
          const prerequisites = prerequisitesRaw.filter(id => id.trim() !== '');
          const hasAllPrerequisites = prerequisites.length === 0 || prerequisites.every(prereqId => allLearnedSubjects.has(prereqId));

          if (!hasAllPrerequisites) continue;

          const subjectCredits = subject.theory_credits + subject.practice_credits;
          const timesLearned = subjectRepetitionCount[subject.subject_id] || 0;
          if (timesLearned >= 3) continue;

          if (totalCredits + subjectCredits > creditLimit) continue;

          selectedSubjects.push(subject.subject_id);
          totalCredits += subjectCredits;
          subjectRepetitionCount[subject.subject_id] = timesLearned + 1;

          let suffix = "";
          if (classMap.has(subject.subject_id)) {
            suffix = classMap.get(subject.subject_id);
          } else {
            suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
            classMap.set(subject.subject_id, suffix);
          }

          classIds.push(`${subject.subject_id}_${suffix}`);

          const practiceCount = Math.min(subject.practice_credits > 0 ? 2 : 0, 2);
          if (practiceCount === 2) {
            const chosenClass = Math.floor(Math.random() * 2) + 1;
            classIds.push(`${subject.subject_id}_${suffix}.${chosenClass}`);
          } else if (practiceCount === 1) {
            classIds.push(`${subject.subject_id}_${suffix}.1`);
          }

          if (totalCredits >= creditLimit) break;
        }

        enrollments.push({
          student_id: student.student_id,
          semester_id: semester.semester_id,
          subject_ids: selectedSubjects, // có thể là []
          class_ids: classIds,           // có thể là []
          credits: totalCredits          // có thể là 0
        });
        
        selectedSubjects.forEach(subId => allLearnedSubjects.add(subId));
      }
    }

    await Enrollment.deleteMany();
    await Enrollment.insertMany(enrollments);

    console.log(`✅ Đã tạo ${enrollments.length} bản ghi enrollment.`);
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Lỗi khi tạo enrollments:", err);
    await mongoose.disconnect();
  }
}

generateEnrollments();







