const { detectAndSaveAbnormalStudentsByClass } = require('../../Services/lecturer/detectAbnormalStudents');
const Notification = require('../../../Database/SaveToMongo/models/Notification')

const getAbnormalStudentsByStudentId = async (req, res) => {
  try {
    const student_id = req.user.student_id;
    if (!student_id) {
      return res.status(400).json({ message: 'Thiếu student_id' });
    }

    const notification = await Notification.findOne({ student_id });
    const results = await detectAndSaveAbnormalStudentsByClass({student_id});
    const isRead = notification?.read || false;

    const merged = results.map(r => ({
      note: r.note,
      updatedAt: r.updatedAt,
      read: isRead
    }));

    return res.status(200).json({ data: merged });
  } catch (error) {
    console.error('Lỗi khi phát hiện sinh viên bất thường:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  getAbnormalStudentsByStudentId
};