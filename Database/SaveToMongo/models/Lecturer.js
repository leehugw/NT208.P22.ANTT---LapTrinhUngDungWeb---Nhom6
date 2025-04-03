const mongoose = require('mongoose');

// Định nghĩa Schema cho Lecturer
const LecturerSchema = new mongoose.Schema({
    lecturer_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    gender: { type: String, enum: ['Nam', 'Nữ', 'Khác'], required: true },
    birth_date: { type: String, required: true },
    faculty_id: { type: String, required: true },
    birth_place: { type: String, required: true },
    school_email: { type: String, required: true, unique: true },
    alias_email: { type: String, default: '' },
    personal_email: { type: String, required: true },
    phone: { type: String, required: true }
});

// Tạo model từ Schema
const Lecturer = mongoose.model('Lecturer', LecturerSchema);

// Xuất module
module.exports = Lecturer;