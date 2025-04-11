const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1] || 
               req.query.token;
  console.log("🧪 Token nhận được:", token); // Debug

  if (!token) {
    console.log("⚠️ Không tìm thấy token trong request");
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    // Kiểm tra quyền truy cập cho cả sinh viên và giảng viên
    if (!user.student_id && !user.lecturer_id) {
      return res.status(403).json({ 
        success: false,
        message: "Tài khoản không có quyền truy cập"
      });
    }
    
    console.log("✅ Giải mã token:", user);
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