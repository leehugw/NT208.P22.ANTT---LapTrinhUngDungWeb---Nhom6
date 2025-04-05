// services/studentService.js
const Student_gpa = require('../../../Database/SaveToMongo/models/Student_gpa');

async function getStudentGPAData(student_id) {
  return Student_gpa.findOne({ student_id: student_id });
}

module.exports = { getStudentGPAData };