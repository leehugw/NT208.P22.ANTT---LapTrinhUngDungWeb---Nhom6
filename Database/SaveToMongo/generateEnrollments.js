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

    // Map để lưu lớp đã tạo theo subject_id + suffix, phục vụ phân lớp chung cho sinh viên
    const classMap = new Map();

    const enrollments = [];

    for (const student of students) {
      // Tìm faculty chứa ngành của sinh viên
      const facultyOfStudent = faculties.find(faculty => faculty.majors.includes(student.major_id));
      if (!facultyOfStudent) {
        console.warn(`⚠️ Không tìm thấy Faculty chứa major_id ${student.major_id} của sinh viên ${student.student_id}`);
        continue;
      }
    
      // Lọc môn học theo faculty_id
      const subjectsOfFaculty = subjects.filter(sub => sub.faculty_id === facultyOfStudent.faculty_id);
    
      // Chọn ngẫu nhiên 2 đến 3 học kỳ gần nhất
      const selectedSemesters = semesters.slice(-Math.floor(Math.random() * 2 + 2));
    
      // Set để lưu môn đã chọn của sinh viên
      const selectedSubjectsSoFar = new Set();
    
      for (const semester of selectedSemesters) {
        const shuffledSubjects = [...subjectsOfFaculty].sort(() => 0.5 - Math.random());
    
        const selectedSubjects = [];
        const classIds = [];
        let totalCredits = 0;
    
        const creditLimit = Math.floor(Math.random() * 29); // 0 đến 28 tín chỉ
    
        for (const subject of shuffledSubjects) {
          if (selectedSubjectsSoFar.has(subject.subject_id)) {
            // Nếu môn đã chọn rồi thì bỏ qua
            continue;
          }
    
          const subjectCredits = subject.theory_credits + subject.practice_credits;
    
          if (totalCredits + subjectCredits > creditLimit) continue;
    
          selectedSubjects.push(subject.subject_id);
          selectedSubjectsSoFar.add(subject.subject_id); // Đánh dấu môn đã chọn
    
          totalCredits += subjectCredits;
    
          // Tạo key để quản lý lớp theo môn học
          const subjectKey = subject.subject_id;
    
          // Lấy hoặc tạo suffix cho môn học
          let suffix = "";
          if (classMap.has(subjectKey)) {
            suffix = classMap.get(subjectKey);
          } else {
            suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
            classMap.set(subjectKey, suffix);
          }
    
          // Class ID lý thuyết (lớp chung)
          classIds.push(`${subject.subject_id}_${suffix}`);
    
          // Class ID thực hành (có thể là 1 hoặc 2)
          const practiceCount = subject.practice_credits > 0 ? 1 : 0;
          for (let i = 1; i <= practiceCount; i++) {
            classIds.push(`${subject.subject_id}_${suffix}.${i}`);
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


