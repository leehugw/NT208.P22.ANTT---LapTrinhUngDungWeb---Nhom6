const feedbackService = require('../../Services/feedback/feedbackService');

exports.createFeedback = async (req, res) => {
  const { role, name, email, type, message } = req.body;

  // Kiểm tra xem tất cả trường có tồn tại không
  if (!role || !name || !email || !type || !message) {
    return res.status(400).json({ error: 'Thiếu thông tin cần thiết: role, name, email, type, message' });
  }

  // Kiểm tra kiểu dữ liệu role và type có hợp lệ không
  const validRoles = ['student', 'teacher'];
  const validTypes = ['bug', 'feedback'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Role không hợp lệ, chỉ chấp nhận "student" hoặc "teacher"' });
  }
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Type không hợp lệ, chỉ chấp nhận "bug" hoặc "feedback"' });
  }

  try {
    // Lưu feedback vào DB
    const savedFeedback = await feedbackService.saveFeedback({ role, name, email, type, message });

    // Nếu lưu thành công, trả về thông báo
    res.status(201).json({
      message: 'Phản hồi đã được gửi thành công!',
      feedback: savedFeedback // Trả về feedback đã lưu, nếu cần
    });
  } catch (error) {
    console.error('Error saving feedback:', error); // Ghi log lỗi để tiện kiểm tra
    res.status(500).json({ error: 'Lỗi lưu vào cơ sở dữ liệu. Vui lòng thử lại sau!' });
  }
};

