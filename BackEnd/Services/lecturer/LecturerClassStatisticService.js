const mongoose = require('mongoose');

class LecturerClassStatisticService {
    async getClassStatistics(classCode) {
        try {
            const db = mongoose.connection;
            const collection = db.collection('classstatistics');
            const data = await collection.findOne({ "classInfo.class_id": classCode });
            if (!data) {
                throw new Error('Class not found');
            }
            return data;
        } catch (err) {
            throw new Error(`Failed to fetch class statistics: ${err.message}`);
        }
    }
}

module.exports = new LecturerClassStatisticService();