require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const TrainingProgram = require('../../../Database/SaveToMongo/models/TrainingProgram'); // Import model MongoDB

const token = process.env.HF_API_KEY;
const url = 'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1';

// Kết nối trực tiếp đến MongoDB
const mongoURI = process.env.DB_URI; // Đảm bảo biến DB_URI được định nghĩa trong file .env
if (!mongoURI) {
    console.error('Lỗi: Không tìm thấy DB_URI trong file .env.');
    process.exit(1);
}

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Kết nối MongoDB thành công'))
    .catch((err) => {
        console.error('Lỗi kết nối MongoDB:', err.message);
        process.exit(1);
    });

if (!token) {
    console.error('Lỗi: Không tìm thấy HF_API_TOKEN trong file .env.');
    process.exit(1);
}

const callHuggingFace = async (question) => {
    try {
        const trainingProgram = await TrainingProgram.findOne({ name: { $regex: question, $options: 'i' } }).lean();
        let additionalInfo = '';

        if (trainingProgram) {
            additionalInfo = `Thông tin chương trình đào tạo: Tên: ${trainingProgram.name}, Khóa: ${trainingProgram.cohort}, Loại: ${trainingProgram.program_types.join(', ')}.`;
        } else {
            additionalInfo = 'Không tìm thấy thông tin chương trình đào tạo liên quan.';
        }

        const response = await axios.post(
            url,
            { inputs: `${question}\n\n${additionalInfo}` },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = response.data;
        const answer = data.generated_text || data[0]?.generated_text || 'Không có câu trả lời.';
        console.log(answer);
        return answer;
    } catch (error) {
        console.error('Lỗi gọi Hugging Face:', error.response?.data || error.message);
        throw new Error('Lỗi khi gọi AI model');
    }
};

callHuggingFace('Chương trình đào tạo nào có khóa 2023?');
//module.exports = { callHuggingFace };