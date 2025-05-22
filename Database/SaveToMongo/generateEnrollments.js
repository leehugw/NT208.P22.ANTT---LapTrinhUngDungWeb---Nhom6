const mongoose = require("mongoose");
const Student = require("./models/Student");
const Subject = require("./models/Subject");
const Semester = require("./models/Semester");
const Enrollment = require("./models/Enrollment");
const Faculty = require('./models/Faculty');

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

    if (!students.length || !subjects.length || !semesters.length || !faculties.length) {
      console.error("❌ Thiếu dữ liệu Student / Subject / Semester / Faculty");
      return;
    }

    const letters = ["A", "B", "C", "D"];
    const minNumber = 20;
    const maxNumber = Math.floor(Math.random() * 3) + 20; // 20 đến 22
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

    for (const student of students) {
      const facultyOfStudent = faculties.find(faculty => faculty.majors.includes(student.major_id));
      if (!facultyOfStudent) {
        console.warn(`⚠️ Không tìm thấy Faculty chứa major_id ${student.major_id} của sinh viên ${student.student_id}`);
        continue;
      }

      const preferredFacultyIds = [facultyPDTDH, facultyBMTL, facultyOfStudent.faculty_id];


      const subjectsOfFaculty = subjects
        .filter(sub => preferredFacultyIds.includes(sub.faculty_id))
        .sort((a, b) => {
          const typeOrder = ['CSN', 'CSNN', 'ĐC', 'CN', 'CNTC', 'TN', 'TTTN'];

          const typeCompare = typeOrder.indexOf(a.subject_type) - typeOrder.indexOf(b.subject_type);

          if (typeCompare !== 0) return typeCompare;

          if (a.subject_type === 'ĐC' && b.subject_type === 'ĐC') {
            const isAPriority = [facultyPDTDH, facultyBMTL].includes(a.faculty_id) ? 0 : 1;
            const isBPriority = [facultyPDTDH, facultyBMTL].includes(b.faculty_id) ? 0 : 1;
            return isAPriority - isBPriority;
          }

          return 0;
        });

      // Chọn hết tất cả học kỳ
      const selectedSemesters = semesters;

      const subjectRepetitionCount = {};

      for (const semester of selectedSemesters) {
        const shuffledSubjects = [...subjectsOfFaculty].sort(() => 0.5 - Math.random());

        const selectedSubjects = [];
        const classIds = [];
        let totalCredits = 0;

        const creditLimit = Math.floor(Math.random() * 29);

        for (const subject of shuffledSubjects) {
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
          subject_ids: selectedSubjects,
          class_ids: classIds,
          credits: totalCredits
        });
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



