const url = 'http://localhost:11434/api/generate';

const callQwen = async (question) => {
    const data = {
        model: "qwen3:8b",
        prompt: question,
        stream: false
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        console.log("Toàn bộ kết quả trả về:", result);
        const rawResponse = result.response || 'Không có câu trả lời.';
        const cleanedResponse = rawResponse.replace(/<think>[\s\S]*?<\/think>/, '').trim();
        return cleanedResponse;
    } catch (error) {
        console.error('Lỗi gọi Qwen API:', error);
        throw new Error('Lỗi khi gọi AI model');
    }
};

module.exports = { callQwen };