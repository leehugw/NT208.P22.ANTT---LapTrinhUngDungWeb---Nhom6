const generateOptimizedScheduleFromExcel = require('../../Services/student/ScheduleService');

const fs = require('fs').promises;

exports.handleOptimizeSchedule = async (req, res) => {
    const file = req.file;
    const { studentId } = req.params;

    if (!file || !studentId) {
        return res.status(400).json({ message: 'File and studentId are required' });
    }

    try {
        const result = await generateOptimizedScheduleFromExcel.generateOptimizedScheduleFromExcel(studentId, file.path);

        await fs.unlink(file.path); // Đảm bảo file được xóa trước khi gửi phản hồi

        res.json({ schedule: result });
    } catch (error) {
        console.error('Controller error:', error);

        // Nếu có lỗi, vẫn cố gắng xóa file (nếu tồn tại)
        try {
            if (file?.path) await fs.unlink(file.path);
        } catch (e) {
            console.error('Failed to delete temp file in catch block:', e);
        }

        res.status(500).json({ message: 'Internal server error' });
    }
};
