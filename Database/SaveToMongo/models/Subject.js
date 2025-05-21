const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema({
  _id: false, // Tắt tự động tạo _id
  subject_id: { type: String, required: true },
  subject_name: { type: String, required: true },
  subjectEL_name: { type: String, required: true },
  faculty_id: { type: String, ref: "Faculty", required: true }, // Liên kết đến Faculty
  subject_type: { type: String, required: true },
  old_id: { type: [String], default: [] },
  equivalent_id: { type: [String], default: [] },
  prerequisite_id: { type: [String], default: [] },
  previous_id: { type: [String], default: [] },
  theory_credits: { type: Number, required: true, min: 0 },
  subject_type: { 
    type: String, 
    required: true,
    enum: ['CN', 'CNTC', 'ĐC', 'TN', 'CSN', 'TTTN', 'CSNN'] // CN = Chuyên ngành, CNTC = Chuyên ngành tự chọn
  },
  practice_credits: { type: Number, required: true, min: 0 }
}, {collection:"subjects",
  timestamps: true,
  // Thêm các tùy chọn để đảm bảo không bị cast sang ObjectId
  toObject: { virtuals: true, getters: true },
  toJSON: { virtuals: true, getters: true } });

// Tạo index cho subject_id
// Định nghĩa index ở đây thay vì trong schema options
SubjectSchema.index({ subject_id: 1 }, { unique: true });

const Subject = mongoose.model("Subject", SubjectSchema);

module.exports = Subject;
