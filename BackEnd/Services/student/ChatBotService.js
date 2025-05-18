require('dotenv').config();
const axios = require('axios');

const token = process.env.HF_API_KEY;; 
const url = 'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct';

if (!token) {
    console.error('Lỗi: Không tìm thấy HF_API_TOKEN trong file .env.');
    process.exit(1);
  }

const callHuggingFace = async (question) => {
    try {
        const response = await axios.post(
          url,
          {inputs: question,
            parameters: {
              max_new_tokens: 20, 
            },
          },
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


module.exports = { callHuggingFace };



