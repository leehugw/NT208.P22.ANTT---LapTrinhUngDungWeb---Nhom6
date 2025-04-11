const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();


router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  (req, res) => {
    if (!req.user || !req.user.role) {
      return res.status(403).send("Role không xác định. Liên hệ admin để cấp quyền.");
    }
    console.log("User từ Passport:", req.user);

    const token = jwt.sign(
      {
        id: req.user._id,
        role: req.user.role,
        student_id: req.user.student_id,
        lecturer_id: req.user.lecturer_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    // Redirect theo role từ DB
    let redirectPath = '/';
    switch (req.user.role) {
      case 'student':
        redirectPath = '/Student_Menu/stu_menu.html'; break;
      case 'lecturer':
        redirectPath = '/Lecturer_Menu/lec_menu.html'; break;
      case 'admin':
        redirectPath = '/Admin_Menu/admin_menu.html'; break;
      default:
        return res.status(403).send("Không có quyền truy cập");
    }
    return res.redirect(`${redirectPath}?token=${token}`);
  }
);

module.exports = router;