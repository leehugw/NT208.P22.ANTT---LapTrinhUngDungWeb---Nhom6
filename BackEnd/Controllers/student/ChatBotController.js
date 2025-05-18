const callHuggingFace = require('../../Services/student/ChatBotService').callHuggingFace;

const handleChatRequest = async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Thiếu câu hỏi!' });
    }

    try {
        const answer = await callHuggingFace(message);
        res.json({ answer });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { handleChatRequest };
