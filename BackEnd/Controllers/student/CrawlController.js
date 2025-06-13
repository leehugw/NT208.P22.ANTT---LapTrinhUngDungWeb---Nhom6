// BackEnd\Controllers\student\CrawlController.js
const CrawlService = require('../../Services/student/CrawlService');
const jwt = require('jsonwebtoken');

exports.crawlStudentInfo = async (req, res) => {
  try {
    const result = await CrawlService.crawlAll();

    // Tạo JWT token cho sinh viên
    const token = jwt.sign(
      {
        student_id: result.student.student_id,
        name: result.student.name,
        role: 'student'
      },
      process.env.JWT_SECRET || 'uit_secret',
      { expiresIn: '1d' }
    );

    // Redirect tới menu sinh viên (phải truy cập trực tiếp từ trình duyệt)
    return res.redirect(`/student/menu/stu_menu.html?token=${token}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};