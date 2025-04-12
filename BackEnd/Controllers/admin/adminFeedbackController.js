const adminFeedbackService = require('../../Services/admin/adminFeedbackService');

exports.getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await adminFeedbackService.getAllFeedbacks();

    // Kiểm tra nếu không có feedbacks
    if (!feedbacks || feedbacks.length === 0) {
      return res.status(404).json({ message: 'Không có phản hồi nào trong hệ thống.' });
    }

    // Trả về danh sách feedbacks nếu tìm thấy
    res.status(200).json(feedbacks);
  } catch (err) {
    console.error('❌ Lỗi khi truy vấn phản hồi:', err);  // Log chi tiết lỗi
    res.status(500).json({ error: 'Lỗi khi truy vấn phản hồi. Vui lòng thử lại sau!' });
  }
};

