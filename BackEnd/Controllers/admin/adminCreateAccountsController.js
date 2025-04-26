const { createLecturerAccount } = require('../../Services/admin/adminCreateAccountsService');

async function createLecturer(req, res) {
    try {
        await createLecturerAccount(req.body);
        res.status(201).json({ message: 'Tạo tài khoản giảng viên thành công!' });
    } catch (error) {
        console.error('Lỗi khi tạo tài khoản giảng viên:', error);
        res.status(500).json({ error: 'Lỗi server khi tạo tài khoản giảng viên.' });
    }
}

module.exports = { createLecturer };