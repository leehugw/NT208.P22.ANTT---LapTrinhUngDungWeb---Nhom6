const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Models
const Enrollment = require('./models/Enrollment'); 
const Class = require('./models/Classes');           
const Lecturer = require('./models/Lecturer');     

const getRandomLecturerId = async () => {
    const lecturers = await Lecturer.find({});
    if (!lecturers.length) throw new Error("❌ Không có giảng viên nào trong DB.");
    const random = lecturers[Math.floor(Math.random() * lecturers.length)];
    return random.lecturer_id;
};

const generateClassData = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log("✅ MongoDB connected");

        // Xóa dữ liệu cũ trong collection 'classes'
        await Class.deleteMany({});
        console.log("✅ Đã xóa toàn bộ dữ liệu cũ trong collection 'classes'");

        const enrollments = await Enrollment.find({});
        if (!enrollments.length) {
            console.log("❌ Không có dữ liệu enrollment.");
            return;
        }

        // Map để gom sinh viên theo class_id, giữ semester_id của lớp đó
        const classMap = new Map();

        for (const enroll of enrollments) {
            const { student_id, class_ids, semester_id } = enroll;

            for (const class_id of class_ids) {
                if (!classMap.has(class_id)) {
                    classMap.set(class_id, {
                        students: new Set(),
                        semester_id: semester_id
                    });
                }
                classMap.get(class_id).students.add(student_id);
            }
        }

        // Tạo mảng để lưu các lớp mới
        const newClasses = [];

        // Lặp qua từng class_id để chuẩn bị dữ liệu lớp mới
        for (const [class_id, data] of classMap.entries()) {
            const { students, semester_id } = data;

            const lecturer_id = await getRandomLecturerId();
            const subject_id = class_id.split('.')[0]; // ví dụ SS004.P21 -> SS004

            newClasses.push({
                class_id,
                semester_id,
                lecturer_id,
                subject_id,
                students: Array.from(students)
            });
        }

        if (newClasses.length > 0) {
            await Class.insertMany(newClasses);
            console.log(`✅ Đã tạo thành công ${newClasses.length} lớp học.`);
        } else {
            console.log("⚠️ Không có lớp học nào để tạo.");
        }

    } catch (err) {
        console.error("❌ Lỗi:", err);
    } finally {
        await mongoose.connection.close();
    }
};

generateClassData();

