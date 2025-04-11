const axios = require('axios');

const callHuggingFace = async (question) => {
    const url = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium'; // hoặc model bạn
    const headers = {
        Authorization: 'Bearer YOUR_HUGGINGFACE_TOKEN',
        'Content-Type': 'application/json'
    };

    try {
        const response = await axios.post(url, { inputs: question }, { headers });

        const data = response.data;
        const answer = data.generated_text || data[0]?.generated_text || 'Không có câu trả lời.';

        return answer;
    } catch (error) {
        console.error('Lỗi gọi Hugging Face:', error.response?.data || error.message);
        throw new Error('Lỗi khi gọi AI model');
    }
};

module.exports = { callHuggingFace };
