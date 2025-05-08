const mongoose = require('mongoose');

const TrainingProgramSchema = new mongoose.Schema({
    program_id: { type: String, required: true },
    cohort: { type: Number, required: true },
    name: { type: String, required: true },
    program_types: [{ type: String, required: true }],
    majors: [
      {
        major_id: { type: String, required: true },
        major_name: { type: String, required: true },
        training_credits: { type: Number, required: true },
        required_courses: [{ type: String, required: true }],
        progress_details: {
          required_general_education: { type: Number, required: true },
          required_major_core: { type: Number, required: true },
          required_major_foundation: { type: Number, required: true },
          required_graduation_project: { type: Number, required: true },
          required_elective_credits: { type: Number, required: true },
          required_semesters: { type: Number }
        }
      }
    ]
}, { collection: "training_programs", timestamps: true });

const TrainingProgram = mongoose.model('TrainingProgram', TrainingProgramSchema);

module.exports = TrainingProgram;
