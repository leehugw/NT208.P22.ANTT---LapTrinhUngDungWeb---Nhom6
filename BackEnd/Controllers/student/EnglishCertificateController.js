const CertificateService = require('../../Services/student/EnglishCertificateService');

const submitCertificate = async (req, res) => {
  try {
    const { studentId, type, score, imageUrl } = req.body;
    if (!studentId || !type || !score || !imageUrl) {
      return res.status(400).json({ error: 'Thiếu dữ liệu đầu vào' });
    }

    const cert = await CertificateService.addCertificate({ studentId, type, score, imageUrl });
    console.log("📦 BODY:", req.body);
    res.status(201).json(cert);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi nộp chứng chỉ' });
  }
};

const getStudentCertificates = async (req, res) => {
  try {
    const studentId = req.query.studentId;
    const data = await CertificateService.getCertificatesByStudent(studentId);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Không thể lấy danh sách chứng chỉ' });
  }
};

module.exports = {
  submitCertificate,
  getStudentCertificates
};
