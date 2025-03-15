const mongoose = require("mongoose");

const CumulativeGpaSchema = new mongoose.Schema({
  student_id: { type: String },
  total_credits_attempted: { type: Number },
  total_credits_earned: { type: Number },
  gpa: { type: Number },
  cumulative_gpa: { type: Number }
});

const CumulativeGpa = mongoose.model("CumulativeGpa", CumulativeGpaSchema);

module.exports = CumulativeGpa;