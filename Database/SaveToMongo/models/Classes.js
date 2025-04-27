const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
    class_id: {
        type: String,
        required: true,
        unique: true // nếu mỗi class_id là duy nhất
    },
    semester_id: {
        type: String,
    },
    lecturer_id: {
        type: String,
        required: true
    },
    subject_id: {
        type: String,
        ref: 'Subject'
    },
    students: {
        type: [String], // Mảng các MSSV dạng chuỗi
    }
}, { collection: 'classes' }, {timestamps: true });

module.exports = mongoose.model('Class', ClassSchema);
