const mongoose = require("mongoose");

const ScoreSchema = new mongoose.Schema({
  score_id: { type: String, unique: true },
  subject_id: { type: String },
  student_id: { type: String },
  credits: { type: Number },
  semester_id: { type: String },
  score_QT: { type: Number, default: null },
  score_GK: { type: Number, default: null },
  score_TH: { type: Number, default: null },
  score_CK: { type: Number },
  score_HP: { type: String },
  status: { type: String, enum: ["Đậu", "Rớt"] }
})

const Score = mongoose.model("Score", ScoreSchema);

module.exports = Score;