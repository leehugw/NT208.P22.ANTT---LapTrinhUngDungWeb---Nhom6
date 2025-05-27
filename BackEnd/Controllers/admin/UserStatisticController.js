const User = require('../../../Database/SaveToMongo/models/Users');

exports.getTotalUsers = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.json({ totalUsers });
  } catch (err) {
    console.error('Lỗi khi đếm user:', err);
    res.status(500).json({ error: 'Lỗi server khi đếm user' });
  }
};