const mongoose = require('mongoose');

// Định nghĩa Schema cho Student
const StudentSchema = new mongoose.Schema({
    student_id: String,
    name: String,
    gender: String,
    birth_date: String,
    birthplace: String,
    status: String,
    class: String,
    faculty: String,
    training_system: String
});

// Tạo model từ Schema
const Student = mongoose.model('Student', StudentSchema);

// Xuất module
module.exports = Student;
