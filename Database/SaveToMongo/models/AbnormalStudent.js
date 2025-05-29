const mongoose = require('mongoose');

const abnormalStudentSchema = new mongoose.Schema({
  student_id: { type: String, required: true },
  class_id: { type: String, required: true },
  status: { type: String, required: true }, // "Cảnh báo" hoặc "Đang học"
  note: { type: String },
  detect_date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AbnormalStudent', abnormalStudentSchema);
