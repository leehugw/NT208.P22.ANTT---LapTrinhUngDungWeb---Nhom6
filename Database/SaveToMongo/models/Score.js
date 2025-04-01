const mongoose = require("mongoose");

const ScoreSchema = new mongoose.Schema({
  score_id: { type: String, unique: true, required: true }, // Mã điểm (duy nhất)
  subject_id: { type: String, required: true, ref: "Subject" }, // Liên kết với bảng môn học
  student_id: { type: String, required: true, ref: "Student" }, // Liên kết với sinh viên
  semester_id: { type: String, required: true }, // Học kỳ
  score_QT: { type: Number, default: null, min: 0, max: 10 }, // Điểm quá trình
  score_GK: { type: Number, default: null, min: 0, max: 10 }, // Điểm giữa kỳ
  score_TH: { type: Number, default: null, min: 0, max: 10 }, // Điểm thực hành
  score_CK: { type: Number, required: true, min: 0, max: 10 }, // Điểm cuối kỳ
  score_HP: { type: String, required: true }, // Điểm học phần (có thể là "Miễn")

  status: { type: String, enum: ["Đậu", "Rớt"], required: true } // Trạng thái
}, {collection: "scores"}, { timestamps: true }); // Thêm thời gian tạo/cập nhật

const Score = mongoose.model("Score", ScoreSchema);
module.exports = Score;
