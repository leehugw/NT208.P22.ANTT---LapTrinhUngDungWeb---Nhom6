const { callQwen } = require('../../Services/student/ChatBotService');

const handleChatRequest = async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Thiếu câu hỏi!' });
    }

    try {
        const answer = await callQwen(message, req.user.student_id);
        res.json({ answer });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { handleChatRequest };