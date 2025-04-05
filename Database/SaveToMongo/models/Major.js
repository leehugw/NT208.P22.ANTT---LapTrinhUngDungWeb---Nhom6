const mongoose = require('mongoose');

const MajorSchema = new mongoose.Schema({
    major_id: { type: String, required: true, unique: true }, // ID của ngành học
    major_name: { type: String, required: true }, // Tên ngành học
    faculty_id: { type: String, required: true }, // Khoa quản lý ngành
    training_credits: { type: Number, required: true }, // Tổng số tín chỉ yêu cầu
    required_courses: { type: [String], required: true }, // Danh sách ID các môn học bắt buộc
    progress_details: {
        required_general_education: { type: Number, required: true }, // Tín chỉ giáo dục đại cương
        required_major_core: { type: Number, required: true }, // Tín chỉ chuyên ngành chính
        required_major_foundation: { type: Number, required: true }, // Tín chỉ cơ sở ngành
        required_graduation_project: { type: Number, required: true }, // Tín chỉ đồ án tốt nghiệp
        required_elective_credits: { type: Number, required: true } // Tín chỉ tự chọn
    }
},{collection:"majors", timestamps: true });

const Major = mongoose.model('Major', MajorSchema);

module.exports = Major;
