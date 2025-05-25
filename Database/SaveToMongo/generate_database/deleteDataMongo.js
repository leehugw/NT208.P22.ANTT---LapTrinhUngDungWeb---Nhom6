const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const deleteData = async () => {
    try {
        await mongoose.connect(process.env.DB_URI, {});
        console.log('✅ MongoDB connected');
        const db = mongoose.connection.db; // Lấy kết nối trực tiếp tới database
        const collection = db.collection("scores"); // Truy cập collection

        // Xóa tất cả documents trong collection
        // const result = await collection.deleteMany({});
        // console.log(`Đã xóa ${result.deletedCount} tài liệu.`);

        const result = await collection.deleteMany({ student_id: "23520851" });
        console.log(`✅ Đã xóa ${result.deletedCount} tài liệu có student_id = 23520851`);
        

    } catch (error) {
        console.error('Lỗi khi xóa dữ liệu:', error);
    } finally {
        mongoose.connection.close();
    }
}

deleteData();
