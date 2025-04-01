const mongoose = require("mongoose");

// Schema cho bảng thống kê GPA tích lũy của sinh viên
const Student_GpaSchema = new mongoose.Schema({
  student_id: { type: String, ref: 'Student', required: true, unique: true },
  total_credits_attempted: { type: Number, default: 0, min: 0 },
  total_credits_earned: { type: Number, default: 0, min: 0 },
  gpa: { type: Number, default: 0, min: 0, max: 10 },
  cumulative_gpa: { type: Number, default: 0, min: 0, max: 10 }
}, {collection: "student_gpa"}, { timestamps: true });

const Student_gpa = mongoose.model('Student_gpa', Student_gpaSchema);

module.exports = Student_Gpa;
