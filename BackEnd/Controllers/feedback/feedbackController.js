const feedbackService = require('../../Services/lecturer/feedbackService');

exports.createFeedback = async (req, res) => {
  const { role, name, email, type, message } = req.body;

  if (!role || !name || !email || !type || !message) {
    return res.status(400).json({ error: 'Thiếu thông tin cần thiết' });
  }

  try {
    await feedbackService.saveFeedback({ role, name, email, type, message });
    res.status(200).json({ message: 'Phản hồi đã được lưu thành công!' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lưu vào cơ sở dữ liệu' });
  }
};

exports.getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await feedbackService.getFeedbacks();
    res.status(200).json({ feedbacks });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi truy vấn dữ liệu' });
  }
};
