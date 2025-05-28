const chatService = require('../../Services/student/chatService');
const User = require('../../../Database/SaveToMongo/models/Users');

const GetSession = async (req, res) => {
  const user = await User.findById(req.user.id).select('student_id');
  try {
    const session = await chatService.getChatHistory(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session không tồn tại' });
    }
    if (session.student_id !== user.student_id) {
      return res.status(403).json({ error: 'Không có quyền truy cập session' });
    }
    res.json({ data: session });
  } catch (error) {
    console.error('Lỗi khi lấy session:', error);
    res.status(500).json({ error: `Lỗi khi lấy session: ${error.message}` });
  }
};

module.exports = { GetSession };