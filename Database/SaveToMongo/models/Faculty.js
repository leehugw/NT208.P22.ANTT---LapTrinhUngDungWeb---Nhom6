const mongoose = require('mongoose');

// Định nghĩa Schema cho Faculty
const FacultySchema = new mongoose.Schema({
    faculty_id: { type: String, required: true, unique: true },
    faculty_name: { type: String, required: true },
    majors: [{ type: String }] // Mảng mã ngành
  }, {
    collection: 'faculty'
});

// Tạo model từ Schema
const Faculty = mongoose.model('Faculty', FacultySchema);

// Xuất module
module.exports = Faculty;