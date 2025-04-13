const mongoose = require('mongoose');

const SemesterSchema = new mongoose.Schema({
  semester: { type: Number, required: true },
  courses: { type: [String], required: true },
  min_elective_tracks: { type: Number },
  min_major_core_tracks: { type: Number }
}, { _id: false }); // Tắt _id tự động cho từng học kỳ

const SemesterPlanSchema = new mongoose.Schema({
  major_id: { type: String, required: true, unique: true, trim: true },
  semester_plan: { type: [SemesterSchema], required: true }
}, { collection: "semester_plan" });

const SemesterPlan = mongoose.model("SemesterPlan", SemesterPlanSchema);

module.exports = SemesterPlan;
