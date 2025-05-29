const chatService = require('../../Services/student/chatService');
const User = require('../../../Database/SaveToMongo/models/Users');

const AddNewSessions = async (req, res) => {
  try {
    const { firstMessage } = req.body;
    if (!req.user.id) {
      return res.status(400).json({ error: 'Không tìm thấy student_id trong token' });
    }
    
    const user = await User.findById(req.user.id).select('student_id');
    const session = await chatService.createSession(user.student_id, firstMessage);
    res.json({ session_id: session.session_id });
  } catch (error) {
    console.error('Lỗi khi tạo session:', error);
    res.status(500).json({ error: `Lỗi khi tạo session: ${error.message}` });
  }
};

module.exports = { AddNewSessions };