const Feedback = require('../../../Database/SaveToMongo/models/Feedback');

exports.saveFeedback = async (feedbackData) => {
  try {
    const newFeedback = await Feedback.create(feedbackData);
    return newFeedback; // trả về feedback mới lưu
  } catch (error) {
    console.error('Error saving feedback:', error);
    throw error; // ném lỗi ra để phía controller xử lý
  }
};
