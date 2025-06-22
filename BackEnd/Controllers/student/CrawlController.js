const CrawlService = require('../../Services/student/CrawlService');
const jwt = require('jsonwebtoken');
const User = require('../../../Database/SaveToMongo/models/Users');

exports.crawlStudentInfo = async (req, res) => {
  try {
    // 1. Crawl dữ liệu từ DAA
    const result = await CrawlService.crawlAll();

    // 2. Truy vấn lại User theo student_id để lấy _id, role...
    const user = await User.findOne({ student_id: result.student.student_id });

    if (!user) throw new Error("Không tìm thấy user sau khi crawl");

    // 3. Tạo JWT token đầy đủ
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        student_id: user.student_id,
        lecturer_id: user.lecturer_id,
        admin_id: user.admin_id,
      },
      process.env.JWT_SECRET || 'uit_secret',
      { expiresIn: '1d' }
    );

    return res.redirect(`/student/menu/stu_menu.html?token=${token}`);
  } catch (err) {
    console.error("Lỗi khi crawl:", err);
    return res.status(500).json({ error: err.message });
  }
};
