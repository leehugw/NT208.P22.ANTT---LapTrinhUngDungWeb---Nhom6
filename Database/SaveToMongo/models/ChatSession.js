// ChatSession.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  message_id: {
    type: String,
    default: function() {
      return `msg_${Date.now()}_${this._id.toString().slice(18,24)}_${Math.floor(Math.random()*1000)}`
    }
  },
  sender: String,
  text: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false }); // Không tạo _id cho subdocument

// Schema chính
const chatSessionSchema = new mongoose.Schema({
  session_id: {
    type: String,
    default: () => `ss_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
  },
  student_id: {
    type: String,
    required: true,
    ref: 'User'
  },
  messages: [messageSchema] // Embed messageSchema
}, {
  timestamps: true,
  collection: 'chat_sessions'
});


// Tạo index để tối ưu hiệu suất
chatSessionSchema.index({ session_id: 1 });
chatSessionSchema.index({ student_id: 1 });
chatSessionSchema.index({ 'messages.timestamp': 1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);