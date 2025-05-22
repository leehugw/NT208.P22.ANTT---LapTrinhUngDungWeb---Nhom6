const mongoose = require('mongoose');

// Định nghĩa Schema cho Lecturer
const LecturerSchema = new mongoose.Schema({
    lecturer_id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true }, // email đăng nhập
    fullname: { type: String, required: true },
    gender: { type: String, enum: ['Nam', 'Nữ', 'Khác'], required: true },
    birthdate: { type: String, required: true },
    birthplace: { type: String, required: true },
    faculty: { type: String, required: true },
    faculty_id: { type: String, required: true },
    class_id: { type: String }, // nếu có
    phonenumber: { type: String, required: true },
    email: { type: String, required: true } // trùng username
});

const Lecturer = mongoose.model('Lecturer', LecturerSchema);

module.exports = Lecturer;