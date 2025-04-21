const mongoose = require('mongoose');

// Định nghĩa Schema cho Lecturer
const LecturerSchema = new mongoose.Schema({
    lecturer_id: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    fullname: { type: String, required: true },
    gender: { type: String, enum: ['Nam', 'Nữ', 'Khác'], required: true },
    birthdate: { type: String, required: true },
    faculty: { type: String, required: true },
    birthplace: { type: String, required: true },
    school_email: { type: String, required: true, unique: true },
    alias_email: { type: String, default: '' },
    email: { type: String, required: true },
    phonenumber: { type: String, required: true }
});

// Tạo model từ Schema
const Lecturer = mongoose.model('Lecturer', LecturerSchema);

// Xuất module
module.exports = Lecturer;