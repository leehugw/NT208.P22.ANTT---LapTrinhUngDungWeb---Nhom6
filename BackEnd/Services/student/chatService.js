// chatService.js
const ChatSession = require('../../../Database/SaveToMongo/models/ChatSession');

// Sử dụng hàm format thời gian chung
const formatVietnameseTime = (date) => {
  return new Date(date).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
  });
};

class ChatService {
  async createSession(student_id) {
      const session = new ChatSession({
          student_id,
          title: 'New Chat'
      });
      
      const savedSession = await session.save();
      
      // Áp dụng format thời gian ngay khi tạo mới
      return {
          ...savedSession.toObject(),
          created_at_formatted: formatVietnameseTime(savedSession.createdAt),
          updated_at_formatted: formatVietnameseTime(savedSession.updatedAt),
          messages: savedSession.messages.map(msg => ({
              ...msg,
              formatted_time: formatVietnameseTime(msg.timestamp)
          }))
      };
  }

    async addMessage(session_id, student_id, sender, text) {
        const message_id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const timestamp = new Date();

        return await ChatSession.findOneAndUpdate(
            { session_id, student_id },
            {
                $push: {
                    messages: {
                        message_id,
                        sender,
                        text,
                        timestamp
                      }
                }
            },
            { new: true }
        );
    }

    async getChatHistory(session_id) {
        const session = await ChatSession.findOne({ session_id }).lean();
        
        if (!session) return null;

        // Áp dụng format thời gian thống nhất
        return {
            ...session,
            messages: session.messages.map(msg => ({
                ...msg,
                formatted_time: formatVietnameseTime(msg.timestamp)
            })),
            // Thêm các trường formatted time khác nếu cần
            created_at_formatted: formatVietnameseTime(session.createdAt),
            updated_at_formatted: formatVietnameseTime(session.updatedAt)
        };
    }
}

module.exports = new ChatService();