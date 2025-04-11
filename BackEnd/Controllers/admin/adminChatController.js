// Controllers/admin/adminChatController.js
const sessionService = require('../../Services/admin/sessionService');

exports.getAllSessions = async (req, res) => {
    try {
        const sessions = await sessionService.getAllSessions();
        res.json({
            success: true,
            data: sessions
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: 'Failed to get sessions',
            error: err.message 
        });
    }
};

exports.getSessionDetails = async (req, res) => {
    try {
        const session = await sessionService.getSessionDetails(req.params.session_id);
        res.json({
            success: true,
            data: session
        });
    } catch (err) {
        const statusCode = err.message === 'Session not found' ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: err.message
        });
    }
};

exports.getStudentConversations = async (req, res) => {
    try {
        const { student_id } = req.params;
        const conversations = await sessionService.getConversationsByStudent(student_id);
        
        res.json({
            success: true,
            data: conversations,
            student_id
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};