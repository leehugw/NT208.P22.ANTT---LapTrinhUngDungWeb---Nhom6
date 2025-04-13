const lecturerService = require('../../Services/admin/adminLecturerListService');

// API lấy danh sách giảng viên
exports.getLecturers = async (req, res) => {
    try {
        const lecturers = await lecturerService.getAllLecturers();
        res.json({ data: lecturers });
    } catch (error) {
        console.error('Error fetching lecturers:', error);
        res.status(500).json({ message: 'Lỗi khi lấy dữ liệu giảng viên' });
    }
};
