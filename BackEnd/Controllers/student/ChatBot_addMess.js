const chatService = require('../../Services/student/chatService');
const User = require('../../../Database/SaveToMongo/models/Users');

const AddMessages = async (req, res) => {
  const user = await User.findById(req.user.id).select('student_id');
  try {
    const { message, sender } = req.body;
    if (!req.user.id) {
      return res.status(400).json({ error: 'Không tìm thấy student_id trong token' });
    }

    const session = await chatService.addMessage(req.params.sessionId, user.student_id, sender, message);
    if (!session) {
      return res.status(404).json({ error: 'Session không tồn tại hoặc không thuộc về bạn' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Lỗi khi lưu tin nhắn:', error);
    res.status(500).json({ error: `Lỗi khi lưu tin nhắn: ${error.message}` });
  }
};

module.exports = { AddMessages };