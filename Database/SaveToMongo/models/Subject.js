const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema({
  subject_id: { type: String, required: true, unique: true },
  subject_name: { type: String, required: true },
  subjectEL_name: { type: String, required: true },
  faculty_id: { type: String, ref: "Faculty", required: true }, // Liên kết đến Faculty
  subject_type: { type: String, required: true },
  old_id: { type: [String], default: [] },
  equivalent_id: { type: [String], default: [] },
  prerequisite_id: { type: [String], default: [] },
  previous_id: { type: [String], default: [] },
  theory_credits: { type: Number, required: true, min: 0 },
  practice_credits: { type: Number, required: true, min: 0 }
}, {collection:"subjects", timestamps: true });

const Subject = mongoose.model("Subject", SubjectSchema);

module.exports = Subject;
