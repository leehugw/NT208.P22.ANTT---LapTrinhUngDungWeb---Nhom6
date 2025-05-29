const chatService = require('../../Services/student/chatService');
const User = require('../../../Database/SaveToMongo/models/Users');

const GetChatHistory = async (req, res) => {
  const user = await User.findById(req.user.id).select('student_id');
  try {
    const sessions = await chatService.getAllSessions(user.student_id);
    res.json({ data: sessions });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách session:', error);
    res.status(500).json({ error: `Lỗi khi lấy danh sách session: ${error.message}` });
  }
};

module.exports = { GetChatHistory };