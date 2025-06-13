const Lecturer = require('../../../Database/SaveToMongo/models/Lecturer');
const User = require('../../../Database/SaveToMongo/models/Users');

async function generateLecturerId() {
    const lastLecturer = await Lecturer.findOne({})
        .sort({ lecturer_id: -1 })
        .collation({ locale: "en_US", numericOrdering: true });
    let nextId = 1;
    if (lastLecturer && lastLecturer.lecturer_id) {
        const num = parseInt(lastLecturer.lecturer_id.replace('GV', ''), 10);
        nextId = num + 1;
    }
    return 'GV' + String(nextId).padStart(3, '0');
}

async function createLecturerAccount(data) {
    // Sinh lecturer_id mới
    const lecturer_id = await generateLecturerId();

    // Tạo lecturer mới
    const lecturer = new Lecturer({
        lecturer_id,
        username: data.username,
        fullname: data.fullname,
        phonenumber: data.phonenumber,
        gender: data.gender,
        birthdate: data.birthdate,
        birthplace: data.birthplace,
        faculty: data.faculty,
        faculty_id: data.faculty,
        class_id: data.class_id,
        email: data.username,
    });
    try {
        await lecturer.save();
        const user = new User({
            username: data.username,
            role: "lecturer",
            lecturer_id: lecturer_id
        });
        await user.save();
        return { success: true, lecturer_id };
    } catch (err) {
        // Xử lý lỗi trùng hoặc thiếu trường
        throw new Error(err.message);
    }
}

module.exports = { createLecturerAccount };