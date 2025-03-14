const mongoose = require('mongoose');

// Định nghĩa Schema cho Student
const IdentitySchema = new mongoose.Schema({
    student_id: String,
    identity_number: String,
    identity_issue_date: String,
    identity_issue_place: String,
    ethnicity: String,
    religion: String,
    origin: String,
    union_join_date: String,
    party_join_date: String
});

// Tạo model từ Schema
const Identity = mongoose.model('Identity', IdentitySchema);

// Xuất module
module.exports = Identity;