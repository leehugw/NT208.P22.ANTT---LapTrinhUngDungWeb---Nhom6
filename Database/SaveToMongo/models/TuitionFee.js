const mongoose = require('mongoose');

const TuitionFeeSchema = new mongoose.Schema({
  academic_year: { type: String, required: true },
  applicable_cohorts: [{ type: String, required: true }],
  regular_semester: {
    new_course_fee: { type: String },
    retake_or_improve_fee: { type: String },
    retake_fee: { type: String },
    improve_fee: { type: String }
  },
  summer_or_off_hours: {
    all_courses_fee: { type: String },
    retake_fee: { type: String },
    improve_fee: { type: String }
  }
}, { collection: 'tuition_fee' });

module.exports = mongoose.model('TuitionFee', TuitionFeeSchema);