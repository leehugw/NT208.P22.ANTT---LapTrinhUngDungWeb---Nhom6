const mongoose = require("mongoose");

const SemesterSchema = new mongoose.Schema({
  semester_id: { type: String },
  semester_name: { type: String },
  start_year: { type: Number },
  end_year: { type: Number }
});

const Semester = mongoose.model("Semester", SemesterSchema);

module.exports = Semester;