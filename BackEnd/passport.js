// BackEnd\passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../Database/SaveToMongo/models/Users'); // MODEL LẤY DỮ LIỆU TỪ DB
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });



passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/api/auth/google/callback",
}, async (accessToken, refreshToken, profile, done) => {
  const email = profile.emails[0].value;
  const googleId = profile.id;

  let user = await User.findOne({ username: email }); // Tìm user trong DB theo email

  // Nếu chưa có user, không tự tạo, chỉ cho phép user đã được định danh sẵn trong DB
  if (!user) {
    return done(null, false, { message: "Tài khoản chưa được cấp quyền. Liên hệ admin." });
  } 

  // Trả về object chứa thông tin cần thiết cho token
  return done(null, {
    _id: user._id,
    username: user.username,
    role: user.role,
    student_id: user.student_id,
    lecturer_id: user.lecturer_id,
    admin_id: user.admin_id,
  });
}));
