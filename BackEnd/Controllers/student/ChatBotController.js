const { callHuggingFace } = require('../../Services/student/ChatBotService');

const handleChatRequest = async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Thiếu câu hỏi!' });
    }

    try {
        const answer = await callHuggingFace(question);
        res.json({ answer });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { handleChatRequest };
