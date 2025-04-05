const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    student_id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    birth_date: { type: String, required: true },
    birthplace: { type: String, trim: true },
    class_id: { type: String, trim: true },
    has_english_certificate: { type: Boolean, required: true },
}, {collection:"students"}, { timestamps: true });

const Student = mongoose.model('Student', StudentSchema);

module.exports = Student;
