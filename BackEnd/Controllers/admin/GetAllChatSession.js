// BackEnd/Controllers/AdminController.js
const ChatSession = require('../../../Database/SaveToMongo/models/ChatSession'); 

const getTotalSessions = async (req, res) => {
    try {
        const totalSessions = await ChatSession.countDocuments();
        console.log('Tổng số phiên trò chuyện:', totalSessions); // Debug
        res.json({ totalSessions });
    } catch (error) {
        console.error('Lỗi khi lấy tổng số phiên:', error.message);
        res.status(500).json({ error: `Lỗi khi lấy tổng số phiên: ${error.message}` });
    }
};

module.exports = { getTotalSessions };