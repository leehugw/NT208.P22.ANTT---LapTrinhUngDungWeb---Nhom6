const mongoose = require("mongoose");

const EnrollmentSchema = new mongoose.Schema({
  student_id: { type: String, ref: "Student", required: true },
  semester_id: { type: String, ref: "Semester", required: true },
  subject_ids: [{ type: String, ref: "Subject" }], // nhiều môn
  class_ids: [{ type: String, ref: "Class" }], // gắn theo subject_id
  credits: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'enrollment',
  timestamps: true
});


module.exports = mongoose.model("Enrollment", EnrollmentSchema);

