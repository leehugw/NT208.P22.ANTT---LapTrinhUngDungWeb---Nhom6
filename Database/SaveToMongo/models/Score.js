const mongoose = require("mongoose");

const ScoreSchema = new mongoose.Schema({
  student_id: { type: String, required: true, ref: "Student" }, // Liên kết với sinh viên
  subject_id: { type: String, required: true, ref: "Subject",
    // Ngăn không cho cast sang ObjectId
    get: id => id,
    set: id => id
   }, // Liên kết với bảng môn học
  semester_id: { type: String, required: true, ref: "Semester"}, // Học kỳ
  score_QT: { type: Number, default: null, min: 0, max: 10 }, // Điểm quá trình
  score_GK: { type: Number, default: null, min: 0, max: 10 }, // Điểm giữa kỳ
  score_TH: { type: Number, default: null, min: 0, max: 10 }, // Điểm thực hành
  score_CK: { type: Number, default: null, min: 0, max: 10 }, // Điểm cuối kỳ
  score_HP: { type: String}, // Điểm học phần (có thể là "Miễn")
  semester_num: { type: String}, // Số học kỳ
  isRetaken: { type: Boolean, default: false }, // Có phải học lại không
  status: { type: String, enum: ["Đậu", "Rớt", "None"], required: true } // Trạng thái
}, {collection: "scores"}); 


ScoreSchema.index({ student_id: 1, subject_id: 1 });

const Score = mongoose.model("Score", ScoreSchema);
module.exports = Score;
