// studentChatController.js
const chatService = require('../../Services/student/chatService');

exports.createConversation = async (req, res) => {
  try {
    const student_id = req.body.student_id;
    
    if (!student_id) {
      return res.status(400).json({ error: "student_id là bắt buộc" });
    }

    const newSession = await chatService.createSession(student_id);
    res.status(201).json(newSession);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addMessage = async (req, res) => {
  try {
    const { session_id } = req.params;
    const { student_id, sender, text } = req.body;

    if (!session_id || !student_id || !sender || !text) {
      return res.status(400).json({
        error: "Thiếu tham số bắt buộc",
        details: {
          missing: [
            ...!session_id ? ['session_id'] : [],
            ...!student_id ? ['student_id'] : [],
            ...!sender ? ['sender'] : [],
            ...!text ? ['text'] : []
          ]
        }
      });
    }

    const updatedSession = await chatService.addMessage(session_id, student_id, sender, text);
    res.json(updatedSession);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const { session_id } = req.params;
    const session = await chatService.getChatHistory(session_id);

    if (!session) {
      return res.status(404).json({ message: "Không tìm thấy session" });
    }

    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};