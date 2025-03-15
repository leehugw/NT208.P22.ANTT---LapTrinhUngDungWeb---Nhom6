const mongoose = require("mongoose");

const SemesterGpaSchema = new mongoose.Schema({
  semester_id: { type: String },
  student_id: { type: String },
  semester_gpa: { type: Number }
});

const SemesterGpa = mongoose.model("SemesterGpa", SemesterGpaSchema);

module.exports = SemesterGpa;