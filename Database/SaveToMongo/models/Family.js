const mongoose = require('mongoose');

// Định nghĩa Schema cho Student
const FamilySchema = new mongoose.Schema({
    student_id: String,
    father_name: String,
    father_job: String,
    father_phone: String,
    father_address: String,
    mother_name: String,
    mother_job: String,
    mother_phone: String,
    mother_address: String,
    guardian_name: String,
    guardian_phone: String,
    guardian_address: String
});

// Tạo model từ Schema
const Family = mongoose.model('Family', FamilySchema);

// Xuất module
module.exports = Family;