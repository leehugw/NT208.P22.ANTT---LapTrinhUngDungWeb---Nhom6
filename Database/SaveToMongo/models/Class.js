const mongoose = require('mongoose');

// Định nghĩa Schema cho Class
const ClassSchema = new mongoose.Schema({
    class_id: { type: String, required: true, unique: true },
    class_name: { type: String, required: true },
    faculty_id: { type: String, required: true },
    training_system: { type: String, required: true },
    major_id: { type: String, required: true }
});

// Tạo model từ Schema
const Class = mongoose.model('Class', ClassSchema);

// Xuất module
module.exports = Class;