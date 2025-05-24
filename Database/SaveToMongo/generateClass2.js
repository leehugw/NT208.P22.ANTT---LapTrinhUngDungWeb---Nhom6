const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const Student = require('./models/Student');
const Lecturer = require('./models/Lecturer');

const getLecturerIdByClassId = async (class_id) => {
  // Tìm giảng viên có class_id trùng lớp
  const lecturers = await Lecturer.find({ class_id: class_id });
  
  if (lecturers.length === 0) {
    // Nếu không có giảng viên nào theo lớp, lấy ngẫu nhiên 1 giảng viên bất kỳ
    const allLecturers = await Lecturer.find({});
    if (allLecturers.length === 0) throw new Error("❌ Không có giảng viên.");
    return allLecturers[Math.floor(Math.random() * allLecturers.length)].lecturer_id;
  }

  // Lấy ngẫu nhiên 1 giảng viên trong số giảng viên có class_id này
  return lecturers[Math.floor(Math.random() * lecturers.length)].lecturer_id;
};

const generateClassesDirectly = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("✅ Kết nối MongoDB thành công");

    const students = await Student.find({ class_id: { $ne: null } });
    const classMap = new Map();

    for (const student of students) {
      const { student_id, class_id } = student;
      if (!classMap.has(class_id)) {
        classMap.set(class_id, new Set());
      }
      classMap.get(class_id).add(student_id);
    }

    const classesCollection = mongoose.connection.db.collection('classes');

    // Tạo mảng các lớp mới
    const newClasses = [];
    for (const [class_id, studentSet] of classMap.entries()) {
      const lecturer_id = await getLecturerIdByClassId(class_id);

      newClasses.push({
        class_id,
        lecturer_id,
        students: Array.from(studentSet)
      });
    }

    // Thêm đồng loạt vào collection 'classes'
    if (newClasses.length > 0) {
      await classesCollection.insertMany(newClasses);
      console.log(`✅ Đã thêm ${newClasses.length} lớp mới`);
    } else {
      console.log("⚠️ Không có lớp nào để thêm");
    }

  } catch (err) {
    console.error("❌ Lỗi:", err);
  } finally {
    await mongoose.connection.close();
  }
};

generateClassesDirectly();

