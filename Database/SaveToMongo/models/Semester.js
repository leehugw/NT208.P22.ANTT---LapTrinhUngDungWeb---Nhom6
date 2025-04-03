const mongoose = require("mongoose");
const mongoose = require('mongoose');

const SemesterSchema = new mongoose.Schema({
  semester_id: { type: String, required: true, unique: true, trim: true },
  semester_name: { type: String, required: true, trim: true },
  start_year: { type: Number, required: true, min: 1900, max: new Date().getFullYear() + 1 },
  end_year: { type: Number, required: true, min: 1900, max: new Date().getFullYear() + 1 }
}, {collection: "semesters"}, { timestamps: true });

const Semester = mongoose.model("Semester", SemesterSchema);

module.exports = Semester;