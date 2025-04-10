const mongoose = require('mongoose');

const StudentAcademicSchema = new mongoose.Schema({
  student_id: { type: String, required: true, unique: true },

  // GPA tích lũy
  total_credits_attempted: { type: Number, default: 0 },
  total_credits_earned: { type: Number, default: 0 },
  gpa: { type: Number, default: 0 },
  cumulative_gpa: { type: Number, default: 0 },

  // GPA từng học kỳ (mảng)
  semester_gpas: [
    {
      semester_id: String,
      semester_gpa: Number
    }
  ],

  // Tiến độ tốt nghiệp
  graduation_progress: { type: Number, default: 0 },
  progress_details: {
    general_education: { type: Number, default: 0 },
    major_core: { type: Number, default: 0 },
    major_foundation: { type: Number, default: 0 },
    graduation_project: { type: Number, default: 0 },
    elective_credits: { type: Number, default: 0 }
  }

}, { collection: "student_academics", timestamps: true });

const StudentAcademic = mongoose.model('StudentAcademic', StudentAcademicSchema);
module.exports = StudentAcademic;
