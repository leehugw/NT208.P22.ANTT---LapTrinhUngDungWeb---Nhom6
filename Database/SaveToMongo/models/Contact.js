const mongoose = require('mongoose');

// Định nghĩa Schema cho Student
const ContactSchema = new mongoose.Schema({
    student_id: String,
    school_email:String,
    alias_email: String,
    personal_email: String,
    phone: String
});

// Tạo model từ Schema
const Contact = mongoose.model('Contact', ContactSchema);

// Xuất module
module.exports = Contact;