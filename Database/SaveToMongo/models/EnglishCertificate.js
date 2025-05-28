const { text } = require('body-parser');
const mongoose = require('mongoose');

const EnglishCertificateSchema = new mongoose.Schema({
  studentId: { type: String, required: true },              // ID sinh viên
  type: { type: String, required: true },                   // Loại chứng chỉ
  score: {type: String, required: true },                   // Điểm số
  imageUrl: { type: String, required: true },               // Base64 ảnh
  status: { type: String, default: 'Đang duyệt' },          // Mặc định
  submittedAt: { type: Date, default: Date.now }            // Ngày đăng ký
}, { collection: 'english_certificates' });

module.exports = mongoose.model('EnglishCertificate', EnglishCertificateSchema);
