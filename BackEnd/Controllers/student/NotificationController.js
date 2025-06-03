const Notification = require('../../../Database/SaveToMongo/models/Notification');

const markNotificationsRead = async (req, res) => {
    try {
        const student_id = req.user.student_id || req.user.id;

        if (!student_id) {
            return res.status(400).json({ success: false, message: 'Thiếu student_id trong token' });
        }

        const existing = await Notification.findOne({ student_id });
        if (!existing) {
            // Tạo mới một thông báo mẫu (nội dung có thể tùy chỉnh)
            await Notification.create({ student_id, read: false });
            // Hoặc tùy ý tạo thông báo với dữ liệu phù hợp
        }

        // Sau đó update các thông báo chưa đọc (read: false) thành read: true
        const result = await Notification.updateMany(
            { student_id, read: false },
            { $set: { read: true } }
        );
        
        return res.json({ success: true, modifiedCount: result.modifiedCount });
    } catch (err) {
        console.error('Lỗi update notifications:', err);
        return res.status(500).json({ success: false, message: 'Lỗi server khi đánh dấu thông báo đã đọc' });
    }
};

module.exports = {
    markNotificationsRead,
};
