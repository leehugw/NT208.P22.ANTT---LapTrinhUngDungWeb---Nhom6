const { detectAbnormalStudentsByClass } = require('../../Services/lecturer/detectAbnormalStudents');

const getAbnormalStudentsByClass = async (req, res) => {
  try {
    const class_id = req.params.class_id;
    if (!class_id) {
      return res.status(400).json({ message: 'Thiếu class_id' });
    }

    const results = await detectAbnormalStudentsByClass(class_id);
    return res.status(200).json({ data: results });
  } catch (error) {
    console.error('Lỗi khi phát hiện sinh viên bất thường:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  getAbnormalStudentsByClass
};
