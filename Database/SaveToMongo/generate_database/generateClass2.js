const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const Student = require('../models/Student');
const Lecturer = require('../models/Lecturer');

const getAdvisorLecturerId = async (class_id) => {
  const lecturer = await Lecturer.findOne({ class_id });
  return lecturer ? lecturer.lecturer_id : null;
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
    const newClasses = [];

    for (const [class_id, studentSet] of classMap.entries()) {
      const lecturer_id = await getAdvisorLecturerId(class_id);

      const classData = {
        class_id,
        students: Array.from(studentSet),
      };

      if (lecturer_id) {
        classData.lecturer_id = lecturer_id;
      } else {
        console.warn(`⚠️ Không tìm thấy giảng viên cố vấn cho lớp ${class_id}`);
      }

      newClasses.push(classData);
    }

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
