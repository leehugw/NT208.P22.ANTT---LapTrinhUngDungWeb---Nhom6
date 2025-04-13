const Lecturer = require('../../../Database/SaveToMongo/models/Lecturer'); 

// Service để lấy tất cả giảng viên
exports.getAllLecturers = async () => {
    try {
        const lecturers = await Lecturer.find(); 
        return lecturers;
    } catch (error) {
        console.error('Error fetching lecturers from DB:', error);
        throw new Error('Không thể lấy thông tin giảng viên');
    }
};
