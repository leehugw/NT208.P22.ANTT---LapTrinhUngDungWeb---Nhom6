// controllers/studentController.js
const path = require('path');
const studentService = require('../../Services/student/StudentGPAViewService');

async function getStudentGPA(req, res) {
  const { student_id } = req.params;

  if (!student_id) {
    return res.status(400).json({ message: 'Student ID is required' });
  }

  try {
    const studentGPA = await studentService.getStudentGPAData(student_id);

    if (!studentGPA) {
      return res.status(404).json({ message: 'Student GPA data not found' });
    }

    return res.json(studentGPA); 
  } catch (error) {
    console.error('Error fetching student GPA:', error);

    res.status(500).json({
      message: 'Error fetching student GPA',
      error: error.message || error,
    });
  }
}

module.exports = { getStudentGPA };