const TrainingProgram = require('../../../Database/SaveToMongo/models/TrainingProgram');
const Student = require('../../../Database/SaveToMongo/models/Student');
const Score = require('../../../Database/SaveToMongo/models/Score');
const Subject = require('../../../Database/SaveToMongo/models/Subject');
const StudentAcademic = require('../../../Database/SaveToMongo/models/StudentAcademic');

async function calculateStudentAcademic(student_id) {
    const student = await Student.findOne({ student_id });
    if (!student) throw new Error("Không tìm thấy sinh viên");

    const program = await TrainingProgram.findOne({ program_id: student.program_id });
    if (!program) throw new Error("Không tìm thấy chương trình đào tạo");

    const major = program.majors.find(m => m.major_id === student.major_id);
    if (!major) throw new Error("Không tìm thấy ngành học");

    const scores = await Score.find({ student_id });
    const subjects = await Subject.find({ subject_id: { $in: scores.map(s => s.subject_id) } });

    // Tính GPA
    let totalCreditsAttempted = 0, totalCreditsEarned = 0;
    let totalWeightedScoreWithoutRetakes = 0, totalWeightedScore = 0;
    let totalCreditsEarnedExcludingExemptions = 0;

    const semesterGPAData = {};

    const firstAttemptScores = {};
    const highestPassedScores = {};

    scores.forEach(score => {
        const scoreHP = parseFloat(score.score_HP);
        const subject = subjects.find(s => String(s.subject_id) === String(score.subject_id));
        if (!subject) return;

        const credits = subject.theory_credits + subject.practice_credits;

        // Lưu điểm lần đầu
        if (!firstAttemptScores[score.subject_id]) {
            if (!score.isRetaken && !isNaN(scoreHP)) {
                firstAttemptScores[score.subject_id] = { credits, scoreHP };
                totalCreditsAttempted += credits;
                totalWeightedScoreWithoutRetakes += scoreHP * credits;
            }
        }

        // Điểm đạt cao nhất
        if ((!isNaN(scoreHP) && scoreHP >= 5) || score.score_HP === "Miễn") {
            const current = highestPassedScores[score.subject_id];

            // Nếu chưa có hoặc điểm hiện tại cao hơn điểm đang lưu
            if (!current || (parseFloat(current.score_HP) < scoreHP)) {
                highestPassedScores[score.subject_id] = score;
            }
        }

        // GPA theo học kỳ
        const sem = score.semester_id;
        if (!semesterGPAData[sem]) {
            semesterGPAData[sem] = { totalCredits: 0, weightedScore: 0 };
        }
        if (!isNaN(scoreHP) && score.score_HP !== "Miễn") {
            semesterGPAData[sem].totalCredits += credits;
            semesterGPAData[sem].weightedScore += scoreHP * credits;
        }
    });

    Object.values(firstAttemptScores).forEach(score => {
        const subject = subjects.find(s => String(s.subject_id) === String(score.subject_id));
        if (!subject) {
            return;
        }

        const credits = subject.theory_credits + subject.practice_credits;
        const scoreHP = parseFloat(score.score_HP);

        totalCreditsAttempted += credits;
        totalWeightedScoreWithoutRetakes += scoreHP * credits;
    });

    Object.values(highestPassedScores).forEach(score => {
        const subject = subjects.find(s => String(s.subject_id) === String(score.subject_id));
        if (!subject) return;

        const credits = subject.theory_credits + subject.practice_credits;
        const scoreHP = parseFloat(score.score_HP);

        totalCreditsEarned += credits;

        if (score.score_HP !== "Miễn") {
            totalCreditsEarnedExcludingExemptions += credits;
            totalWeightedScore += scoreHP * credits;
        }
    });

    const gpa = totalCreditsAttempted > 0 ? (totalWeightedScoreWithoutRetakes / totalCreditsAttempted).toFixed(2) : "0.00";
    const cumulative_gpa = totalCreditsEarned > 0 ? (totalWeightedScore / totalCreditsEarnedExcludingExemptions).toFixed(2) : "0.00";

    const semester_gpas = Object.entries(semesterGPAData).map(([semester_id, data]) => {
        return {
            semester_id,
            semester_gpa: (data.totalCredits > 0 ? (data.weightedScore / data.totalCredits).toFixed(2) : "0.00"),
            updatedAt: new Date()
        };
    });

    // Tính tiến độ tốt nghiệp
    const passedScores = scores.filter(s => s.status === "Đậu");
    const passedSubjects = subjects.filter(s => passedScores.some(ps => ps.subject_id === s.subject_id));

    const requiredCourses = new Set(major.required_courses);
    const progress = {
        general_education: 0,
        major_core: 0,
        major_foundation: 0,
        graduation_project: 0,
        elective_credits: 0
    };

    passedScores.forEach(score => {
        const subject = subjects.find(s => s.subject_id === score.subject_id);
        if (!subject) return;
        const credits = subject.theory_credits + subject.practice_credits;
        if (requiredCourses.has(subject.subject_id)) {
            switch (subject.subject_type) {
                case "ĐC": progress.general_education += credits; break;
                case "CN": case "CNTC": case "ĐA": progress.major_core += credits; break;
                case "CSNN": case "CSN": progress.major_foundation += credits; break;
                case "TTTN": case "TN": case "KLTN": case "CĐTN": progress.graduation_project += credits; break;
            }
        } else {
            progress.elective_credits += credits;
        }
    });

    const limitedProgress = { ...progress };
    Object.keys(limitedProgress).forEach(key => {
        limitedProgress[key] = Math.min(limitedProgress[key], major.progress_details[`required_${key}`]);
    });

    const totalProgress = Object.values(limitedProgress).reduce((sum, val) => sum + val, 0);
    let graduation_progress = Math.round((totalProgress / major.training_credits) * 100);
    if (!student.has_english_certificate) graduation_progress -= 1;

    return {
        student_id,
        total_credits_attempted: totalCreditsAttempted,
        total_credits_earned: totalCreditsEarned,
        gpa,
        cumulative_gpa,
        semester_gpas,
        graduation_progress,
        progress_details: progress
    };
}

async function updateStudentAcademic(student_id) {
    const newData = await calculateStudentAcademic(student_id);
    const existing = await StudentAcademic.findOne({ student_id });

    if (!existing) {
        return await StudentAcademic.create(newData);
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const latestSemester = existing.semester_gpas?.[existing.semester_gpas.length - 1];
    if (latestSemester && new Date(latestSemester.updatedAt) > sixMonthsAgo) {
        return existing;
    }

    return await StudentAcademic.findOneAndUpdate(
        { student_id },
        newData,
        { new: true }
    );
}

module.exports = { updateStudentAcademic };