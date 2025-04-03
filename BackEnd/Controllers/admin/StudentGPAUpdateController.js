const studentGPAService = require('../../Services/admin/StudentGPAUpdateService');

async function updateStudentGPA(req, res) {
    try {
        const { student_id } = req.params;
        const result = await studentGPAService.updateStudentGPA(student_id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function updateAllGPAs(req, res) {
    try {
        const results = await studentGPAService.updateAllStudentGPAs();
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = { updateStudentGPA, updateAllGPAs };
