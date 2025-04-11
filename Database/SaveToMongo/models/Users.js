const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true }, // email
  role: { type: String, enum: ['admin', 'student', 'lecturer'], required: true },
  student_id: { type: String },   // nếu là sinh viên
  lecturer_id: { type: String },  // nếu là giảng viên
}, { collection: 'users', timestamps: true });

module.exports = mongoose.model('User', userSchema);