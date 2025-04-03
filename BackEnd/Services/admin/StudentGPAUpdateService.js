// services/studentGPAService.js
const Subject = require('../../../Database/SaveToMongo/models/Subject');
const Score = require('../../../Database/SaveToMongo/models/Score');
const StudentGPA = require('../../../Database/SaveToMongo/models/Student_gpa');
const Student = require('../../../Database/SaveToMongo/models/Student');

async function calculateGPA(student_id) {


  const scores = await Score.aggregate([
    { $match: { student_id: student_id.toString() } },
    { $lookup: { from: 'subjects', localField: 'subject_id', foreignField: 'subject_id', as: 'subject_details' } },
    { $unwind: '$subject_details' },
  ]);

  let totalCreditsAttempted = 0;
  let totalCreditsEarned = 0;
  let totalWeightedScoreWithoutRetakes = 0;
  let totalWeightedScore = 0;
  let totalCreditsEarnedExcludingExemptions = 0;

  scores.forEach(score => {
    const subjects = score.subject_details;
    const theorycredits = subjects.theory_credits;
    const practicecredits = subjects.practice_credits;
    const credits = theorycredits + practicecredits;
    const scoreHP = score.score_HP;
    const status = score.status;
    const scoreHPNumber = parseFloat(scoreHP);
    const isRetaken = score.isRetaken;

    if (!isNaN(scoreHPNumber) && !isRetaken) {
      totalCreditsAttempted += credits;
      totalWeightedScoreWithoutRetakes += scoreHPNumber * credits;
    }
   

    if ((!isNaN(scoreHPNumber) && scoreHPNumber >= 5) || scoreHP === "Miễn") {
      totalCreditsEarned += credits;
      if (scoreHP !== "Miễn") {
        totalCreditsEarnedExcludingExemptions += credits;
        totalWeightedScore += scoreHPNumber * credits;
      }
    }
  });

  const gpa = totalCreditsAttempted > 0 ? (totalWeightedScoreWithoutRetakes / totalCreditsAttempted).toFixed(2) : "0.00";
  const cumulativeGPA = totalCreditsEarned > 0 ? (totalWeightedScore / totalCreditsEarnedExcludingExemptions).toFixed(2) : "0.00";

  return {
    student_id: student_id,
    total_credits_attempted: totalCreditsAttempted,
    total_credits_earned: totalCreditsEarned,
    gpa: gpa,
    cumulative_gpa: cumulativeGPA,
  };
}

async function updateStudentGPA(student_id) {
  const newStudentGPAData = await calculateGPA(student_id);
  const currentStudentGPAData = await StudentGPA.findOne({ student_id: student_id });

  if (!currentStudentGPAData) {
    await StudentGPA.create(newStudentGPAData);
    return { message: 'GPA created successfully', studentGPAData: newStudentGPAData };
  } else {
    if (
      currentStudentGPAData.total_credits_attempted !== newStudentGPAData.total_credits_attempted ||
      currentStudentGPAData.total_credits_earned !== newStudentGPAData.total_credits_earned ||
      currentStudentGPAData.gpa !== newStudentGPAData.gpa ||
      currentStudentGPAData.cumulative_gpa !== newStudentGPAData.cumulative_gpa
    ) {
      await StudentGPA.findOneAndUpdate({ student_id: student_id }, newStudentGPAData, { new: true });
      return { message: 'GPA updated successfully', studentGPAData: newStudentGPAData };
    } else {
      return { message: 'GPA not changed, no update needed', studentGPAData: currentStudentGPAData };
    }
  }
}

async function updateAllStudentGPAs() {
  try {
    const students = await Student.find({}, 'student_id'); // Lấy danh sách sinh viên
    
    const results = await Promise.all(
      students.map(student => updateStudentGPA(student.student_id))
    );

    return results;
  } catch (error) {
    throw error;
  }
}

updateAllStudentGPAs();

module.exports = { calculateGPA, updateStudentGPA, updateAllStudentGPAs };
