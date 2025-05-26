const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1] || req.query.token;

  if (!token) {
    console.log("Không tìm thấy token trong request");
    return res.status(401).json({ success: false, message: "Token không được cung cấp" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err || !user) {
      return res.status(403).json({ success: false, message: "Token không hợp lệ hoặc hết hạn", error: err?.message });
    }

    // Cho phép nếu là student, lecturer hoặc admin
    const isStudent = user.student_id;
    const isLecturer = user.lecturer_id;
    const isAdmin = user.role === 'admin';

    if (!isStudent && !isLecturer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản không có quyền truy cập"
      });
    }

    req.user = user;
    next();
  });
}

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.sendStatus(403);
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };