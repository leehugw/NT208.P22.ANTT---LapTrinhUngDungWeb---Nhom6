const LecturerClassStatisticService = require('../../Services/lecturer/LecturerClassStatisticService');
const ClassStatistic = require('../../../Database/SaveToMongo/models/ClassStatistic');

exports.getClassStatisticByClassId = async (req, res) => {
    try {
        const classCode = req.params.classId;
        const data = await LecturerClassStatisticService.getClassStatistics(classCode);

        if (!data) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thống kê lớp.' });
        }

        res.status(200).json({
            success: true,
            classInfo: data.classInfo,
            statistics: data.statistics
        });
    } catch (err) {
        console.error("🔥 Lỗi khi truy vấn MongoDB:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.addOrUpdateClassStatistic = async (req, res) => {
    try {
        const { classCode, statistics } = req.body;
        if (!classCode || !statistics) {
            return res.status(400).json({ success: false, message: 'Thiếu classCode hoặc statistics' });
        }

        const existing = await ClassStatistic.findOne({ 'classInfo.classCode': classCode });
        if (existing) {
            // Cập nhật
            existing.statistics = statistics;
            await existing.save();
            return res.json({ success: true, message: 'Đã cập nhật thống kê' });
        } else {
            // Tạo mới
            const newStat = new ClassStatistic({
                classInfo: {
                    classCode,
                    totalStudents: statistics.totalStudents || 0,
                    startYear: statistics.startYear || 2022
                },
                statistics
            });

            await newStat.save();
            return res.json({ success: true, message: 'Đã tạo thống kê mới' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};