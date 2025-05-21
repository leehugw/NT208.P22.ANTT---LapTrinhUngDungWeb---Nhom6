const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  student_id: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  birth_date: { type: String, required: true },
  birthplace: { type: String, trim: true },
  class_id: { type: String, trim: true },
  major_id: { type: String, required: true },
  program_id: { type: String, required: true },
  program_type: { type: String, required: true },
  has_english_certificate: { type: Boolean, required: true },

  contact: {
    school_email: { type: String, trim: true },
    alias_email: { type: String, trim: true },
    personal_email: { type: String, trim: true },
    phone: { type: String, trim: true }
  },

  address: {
    permanent_address: { type: String, trim: true },
    temporary_address: { type: String, trim: true }
  },

  identity: {
    identity_number: { type: String, trim: true },
    identity_issue_date: { type: String, trim: true },
    identity_issue_place: { type: String, trim: true },
    ethnicity: { type: String, trim: true },
    religion: { type: String, trim: true },
    origin: { type: String, trim: true },
    union_join_date: { type: String, trim: true },
    party_join_date: { type: String, trim: true }
  },

  family: {
    father: {
      name: { type: String, trim: true },
      job: { type: String, trim: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true }
    },
    mother: {
      name: { type: String, trim: true },
      job: { type: String, trim: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true }
    },
    guardian: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true }
    }
  }
}, { collection: "students", timestamps: true });

const Student = mongoose.model('Student', StudentSchema);

module.exports = Student;
