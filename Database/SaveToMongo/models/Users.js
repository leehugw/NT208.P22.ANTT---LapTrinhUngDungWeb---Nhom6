const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true }, // email
  role: { type: String, enum: ['admin', 'student', 'lecturer'], required: true },
}, { collection: 'users', timestamps: true }); 

module.exports = mongoose.model('User', userSchema);