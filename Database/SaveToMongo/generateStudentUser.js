const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../BackEnd/.env') });

// Kết nối MongoDB
mongoose.connect(process.env.DB_URI, {})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const Student = require('./models/Student');
const Account = require('./models/Users');

// Hàm tạo tài khoản sinh viên
async function generateStudentAccounts() {
  try {
    // Debug 1: Đếm tổng số sinh viên
    const totalStudents = await Student.countDocuments();
    console.log(`Tổng số sinh viên: ${totalStudents}`);

    // Debug 2: Đếm số sinh viên có student_id
    const studentsWithId = await Student.countDocuments({ student_id: { $exists: true } });
    console.log(`Số sinh viên có student_id: ${studentsWithId}`);

    // Lấy tất cả student_id
    const students = await Student.find({}, { student_id: 1, _id: 0 });
    console.log(`Số student_id lấy được: ${students.length}`);

    // Kiểm tra 5 student_id đầu tiên
    console.log('5 student_id đầu tiên:', students.slice(0, 5).map(s => s.student_id));

    const accounts = students
      .filter(s => s.student_id) // Lọc những ai có student_id
      .map(student => {
        const studentId = student.student_id;
        return {
          username: `${studentId}@gm.uit.edu.vn`,
          password: `abcd${studentId.slice(-4)}`,
          role: 'student',
          student_id: studentId
        };
      });

    console.log(`Số tài khoản sẽ tạo: ${accounts.length}`);

    await Account.deleteMany({ role: 'student' });
    await Account.insertMany(accounts);
    
    console.log(`✅ Đã tạo ${accounts.length} tài khoản sinh viên từ ${totalStudents} sinh viên`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Lỗi khi tạo tài khoản:', err);
    await mongoose.disconnect();
  }
}

generateStudentAccounts();