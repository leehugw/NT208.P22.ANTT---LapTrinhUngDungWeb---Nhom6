const { detectAndSaveAbnormalStudentsByClass } = require('../../Services/lecturer/detectAbnormalStudents');
const Notification = require('../../../Database/SaveToMongo/models/Notification')

const getAbnormalStudentsByStudentId = async (req, res) => {
  try {
    const student_id = req.user.student_id;
    if (!student_id) {
      return res.status(400).json({ message: 'Thiếu student_id' });
    }

    const notification = await Notification.findOne({ student_id });
    const results = await detectAndSaveAbnormalStudentsByClass({ student_id });
    const lastReadAt = notification?.updatedAt || new Date(0); // nếu chưa từng đọc, dùng ngày 0

    const merged = results.map(r => {
      const wasUpdated = new Date(r.updatedAt) > new Date(lastReadAt);
      return {
        note: r.note,
        updatedAt: r.updatedAt,
        read: !wasUpdated // nếu có cập nhật mới => chưa đọc
      };
    });

    return res.status(200).json({ data: merged });
  } catch (error) {
    console.error('Lỗi khi phát hiện sinh viên bất thường:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  getAbnormalStudentsByStudentId
};