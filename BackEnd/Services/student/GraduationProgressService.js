const Student = require('../../../Database/SaveToMongo/models/Student');
const Major = require('../../../Database/SaveToMongo/models/Major');
const Score = require('../../../Database/SaveToMongo/models/Score');
const Class = require('../../../Database/SaveToMongo/models/Class');
const Subject = require('../../../Database/SaveToMongo/models/Subject');


const GraduationProgress = require('../../../Database/SaveToMongo/models/GraduationProgress');

const calculateGraduationProgress = async (studentId) => {
    const student = await Student.findOne({ student_id: studentId }).populate("class_id");
    if (!student || !student.class_id) throw new Error("Không tìm thấy thông tin lớp của sinh viên");

    const studentClass = await Class.findOne({ class_id: student.class_id });
    if (!studentClass) throw new Error("Không tìm thấy lớp học của sinh viên");

    const major = await Major.findOne({ major_id: studentClass.major_id });
    if (!major) throw new Error("Không tìm thấy ngành học của sinh viên");

    const scores = await Score.find({ student_id: studentId, status: "Đậu" });
    const subjects = await Subject.find({ subject_id: { $in: scores.map(s => s.subject_id) } });

    const requiredCourses = new Set(major.required_courses);
    let progress = {
        general_education: 0,
        major_core: 0,
        major_foundation: 0,
        graduation_project: 0,
        elective_credits: 0
    };

    scores.forEach(score => {
        const subject = subjects.find(sub => sub.subject_id === score.subject_id);
        if (!subject) return;

        const credits = subject.theory_credits + subject.practice_credits;
        if (requiredCourses.has(subject.subject_id)) {
            switch (subject.subject_type) {
                case "ĐC": progress.general_education += credits; break;
                case "CN": case "CSNN": progress.major_core += credits; break;
                case "CSNN": case "CSN": progress.major_foundation += credits; break;
                case "TTTN": case "TN": case "KLTN": case "CNTC": progress.graduation_project += credits; break;
            }
        } else {
            progress.elective_credits += credits;
        }
    });

    let limitedProgress = { ...progress };
    Object.keys(limitedProgress).forEach(key => {
        limitedProgress[key] = Math.min(limitedProgress[key], major.progress_details[`required_${key}`]);
    });    

    const totalProgress = Object.values(limitedProgress).reduce((sum, val) => sum + val, 0);
    let graduation_progress = Math.round((totalProgress / major.training_credits) * 100);
    if (student.has_english_certificate){
        graduation_progress = graduation_progress;
    }
    else{
        graduation_progress = graduation_progress - 1;
    }

    return { graduation_progress, progress };
};

const updateGraduationProgress = async (studentId) => {
    const lastRecord = await GraduationProgress.findOne({ student_id: studentId });
    const { graduation_progress, progress } = await calculateGraduationProgress(studentId);

    if (lastRecord) {
        const lastUpdate = new Date(lastRecord.updatedAt);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        if (lastUpdate > sixMonthsAgo && Math.abs(lastRecord.graduation_progress - graduation_progress) < 1) {
            return lastRecord;
        }

        return GraduationProgress.findOneAndUpdate(
            { student_id: studentId },
            { graduation_progress, progress_details: progress },
            { new: true }
        );
    }

    return GraduationProgress.create({ student_id: studentId, graduation_progress, progress_details: progress });
};

module.exports = { updateGraduationProgress };

