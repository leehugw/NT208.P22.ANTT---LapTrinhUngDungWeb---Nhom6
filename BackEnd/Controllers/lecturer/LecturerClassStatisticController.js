const LecturerClassStatisticService = require('../../Services/lecturer/LecturerClassStatisticService');

exports.getClassStatisticByClassId = async (req, res) => {
    try {
        const classCode = req.query.class_id;
        console.log("Thống kê lớp:", classCode);

        if (!classCode) {
            return res.status(400).json({ success: false, message: 'Thiếu mã lớp rồi' });
        }

        const data = await LecturerClassStatisticService.getClassStatistics(classCode);

        if (!data || !data.statistics) {
            return res.status(404).json({ success: false, message: 'Không có dữ liệu thống kê' });
        }
        await LecturerClassStatisticService.updateClassStats(classCode, data.statistics);

        res.status(200).json({
            success: true,
            classInfo: data.classInfo,
            statistics: data.statistics
        });
    } catch (err) {
        console.error("Lỗi khi lấy thống kê:", err);
        res.status(500).json({
            success: false,
            message: `Server lỗi: ${err.message}`
        });
    }
};

exports.addOrUpdateClassStatistic = async (req, res) => {
    try {
        const { classCode } = req.body;
        if (!classCode) {
            return res.status(400).json({ success: false, message: 'Thiếu mã lớp' });
        }

        const result = await LecturerClassStatisticService.getClassStatistics(classCode);

        await LecturerClassStatisticService.updateClassStats(classCode, result.statistics);

        res.status(200).json({ success: true, message: 'Thống kê đã được cập nhật đầy đủ' });
    } catch (err) {
        console.error("Lỗi khi cập nhật MongoDB:", err.message);
        res.status(500).json({ success: false, message: 'Server lỗi' });
    }
};