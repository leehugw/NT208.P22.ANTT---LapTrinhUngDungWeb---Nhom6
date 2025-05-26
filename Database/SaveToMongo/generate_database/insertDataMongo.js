const mongoose = require('mongoose');
const fs = require('fs');

require('dotenv').config({ path: '../../.env' });

const insertData = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log("✅ Đã kết nối MongoDB");

        const db = mongoose.connection.db; // Truy cập database
        const collection = db.collection("training_schedule"); // Truy cập collection

        // Đọc file JSON
        const filePath = "Json\\trainingschedule.json";
        const jsonData = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(jsonData); // Chuyển JSON thành object

        // Thêm dữ liệu vào MongoDB
        const result = await collection.insertMany(data);
        console.log(`✅ Đã thêm ${result.insertedCount} tài liệu vào MongoDB`);

    } catch (error) {
            console.error("Lỗi khi chèn dữ liệu:", error);
    } finally {
        mongoose.connection.close();
    }
};

insertData();
