const mongoose = require("mongoose");

const SemesterSchema = new mongoose.Schema({
  semester_id: { type: String, required: true, unique: true, trim: true },
  semester_name: { type: String, required: true, trim: true },
  start_date: { type: Date, required: true }, 
  end_date: { type: Date, required: true } 
}, {collection: "semesters"}, { timestamps: true });

const Semester = mongoose.model("Semester", SemesterSchema);

module.exports = Semester;