const mongoose = require('mongoose');

const SemesterSchema = new mongoose.Schema({
    semester: { type: Number, required: true }, // học kỳ (1,2,3,...)
    courses: [{ type: String, required: true }], // mã các môn học trong học kỳ
    min_major_core_tracks: { type: Number, default: null }, // số lượng môn chuyên ngành tối thiểu (nếu có)
    min_elective_tracks: { type: Number, default: null } // số lượng môn tự chọn tối thiểu (nếu có)
}, { _id: false });

const SemesterPlanSchema = new mongoose.Schema({
    major_id: { type: String, required: true, unique: true }, // mã ngành
    semester_plan: { type: [SemesterSchema], required: true } // kế hoạch học kỳ
}, { collection: "semester_plan" }); // collection trong MongoDB

const SemesterPlan = mongoose.model('SemesterPlan', SemesterPlanSchema);

module.exports = SemesterPlan;
