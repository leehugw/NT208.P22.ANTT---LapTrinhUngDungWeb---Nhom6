const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  role: { type: String, enum: ['student', 'teacher'], required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  type: { type: String, enum: ['bug', 'feedback'], required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
},{collection:"feedbacks", timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
