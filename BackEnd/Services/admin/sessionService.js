// sessionService.js
const ChatSession = require('../../../Database/SaveToMongo/models/ChatSession');

// Hàm hỗ trợ format thời gian
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

class SessionService {
    // Lấy tất cả session (cho admin dashboard)
    async getAllSessions() {
        const sessions = await ChatSession.find({})
            .select('session_id student_id title messages updatedAt createdAt')
            .lean();

        return this._formatSessions(sessions);
    }

    // Lấy chi tiết session (cho admin xem chat log)
    async getSessionDetails(sessionId) {
        const session = await ChatSession.findOne({ session_id: sessionId })
            .select('session_id student_id title messages updatedAt createdAt')
            .lean();

        if (!session) throw new Error('Session not found');
        return this._formatSession(session);
    }

    // Lấy tất cả conversations của 1 sinh viên
    async getConversationsByStudent(student_id) {
        const sessions = await ChatSession.find({ student_id })
            .select('session_id title messages updatedAt createdAt')
            .sort({ updatedAt: -1 })
            .lean();

        return this._formatSessions(sessions, true);
    }

    // ----------- Private methods -----------
    _formatSessions(sessions, includeLastMessageTime = false) {
        return sessions.map(session => {
            const formatted = this._formatSession(session);
            if (includeLastMessageTime) {
                formatted.last_message_time = formatVietnameseTime(session.updatedAt);
            }
            return formatted;
        });
    }

    _formatSession(session) {
        return {
            ...session,
            messages: session.messages.map(msg => ({
                ...msg,
                formatted_time: formatVietnameseTime(msg.timestamp)
            }))
        };
    }
}

module.exports = new SessionService();