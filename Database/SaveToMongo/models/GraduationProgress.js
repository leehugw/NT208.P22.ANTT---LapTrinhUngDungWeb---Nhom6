const mongoose = require('mongoose');

const graduationProgressSchema = new mongoose.Schema({
    student_id: { type:String, ref: 'Student', required: true, unique: true},
    graduation_progress: { type: Number, required: true },
    progress_details: {
        general_education: { type: Number, default: 0 },  // Tín chỉ môn đại cương
        major_core: { type: Number, default: 0 },         // Tín chỉ môn chuyên ngành chính
        major_foundation: { type: Number, default: 0 },   // Tín chỉ môn cơ sở ngành
        graduation_project: { type: Number, default: 0 }, // Tín chỉ đồ án tốt nghiệp
        elective_credits: { type: Number, default: 0 }    // Tín chỉ tự do
    }
}, {collection:"graduationprogress", timestamps: true });

const GraduationProgress = mongoose.model('GraduationProgress', graduationProgressSchema);

module.exports = GraduationProgress;
