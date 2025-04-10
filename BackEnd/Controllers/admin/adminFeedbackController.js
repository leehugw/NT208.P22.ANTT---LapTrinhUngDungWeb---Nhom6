const adminFeedbackService = require('../../Services/admin/adminFeedbackService');

exports.getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await adminFeedbackService.getAllFeedbacks();
    res.json(feedbacks);
  } catch (err) {
    console.error('❌ Lỗi khi truy vấn phản hồi:', err);
    res.status(500).json({ error: 'Lỗi khi truy vấn phản hồi' });
  }
};
