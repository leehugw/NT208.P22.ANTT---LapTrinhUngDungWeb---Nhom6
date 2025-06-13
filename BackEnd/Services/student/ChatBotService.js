const Score = require('../../../Database/SaveToMongo/models/Score');

const callQwen = async (question, stu_id) => {
    const url = 'http://localhost:11434/api/generate';
    try {
        const student_id = stu_id;
        if (!student_id) throw new Error('Không tìm thấy mã số sinh viên');

        let responseText = 'Không có câu trả lời.';

        if (question.toLowerCase().includes('điểm học kỳ của tôi') || question.toLowerCase().includes('điểm của tôi')) {
            const rawDocs = await Score.find({ student_id }).lean();

            if (!rawDocs.length) {
                responseText = `Không tìm thấy điểm cho sinh viên có mã ${student_id}. Vui lòng kiểm tra database hoặc liên hệ phòng đào tạo.`;
            } else {
                // Tính điểm trung bình
                let qtSum = 0, gkSum = 0, thSum = 0, ckSum = 0, hpSum = 0;
                let qtCount = 0, gkCount = 0, thCount = 0, ckCount = 0, hpCount = 0;

                 rawDocs.forEach((doc) => {
                    if (typeof doc.score_QT === 'number' && !isNaN(doc.score_QT)) { qtSum += doc.score_QT; qtCount++; }
                    if (typeof doc.score_GK === 'number' && !isNaN(doc.score_GK)) { gkSum += doc.score_GK; gkCount++; }
                    if (typeof doc.score_TH === 'number' && !isNaN(doc.score_TH)) { thSum += doc.score_TH; thCount++; }
                    if (typeof doc.score_CK === 'number' && !isNaN(doc.score_CK)) { ckSum += doc.score_CK; ckCount++; }
                    if (typeof doc.score_HP === 'string') {
                        const hpValue = parseFloat(doc.score_HP);
                        if (!isNaN(hpValue) && hpValue >= 0 && hpValue <= 10) {
                            hpSum += hpValue;
                            hpCount++;
                        } else {
                            console.log(`Invalid score_HP value: ${doc.score_HP}`);
                        }
                    }
                });

                const averages = {
                    score_QT: qtCount ? (qtSum / qtCount).toFixed(2) : 'Chưa có',
                    score_GK: gkCount ? (gkSum / gkCount).toFixed(2) : 'Chưa có',
                    score_TH: thCount ? (thSum / thCount).toFixed(2) : 'Chưa có',
                    score_CK: ckCount ? (ckSum / ckCount).toFixed(2) : 'Chưa có',
                    score_HP: hpCount ? (hpSum / hpCount).toFixed(2) : 'Chưa có'
                };

                const prompt = `Nhận xét chi tiết bằng tiếng Việt về điểm trung bình của sinh viên (mã ${student_id}) dựa trên các điểm sau: QT: ${averages.score_QT}, GK: ${averages.score_GK}, TH: ${averages.score_TH}, CK: ${averages.score_CK}, HP: ${averages.score_HP}. Gợi ý cải thiện rõ ràng, kĩ càng nếu điểm trung bình dưới 7.0.`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: 'qwen3:4b', prompt, stream: false })
                });

                if (!response.ok) throw new Error('Qwen API lỗi');
                const result = await response.json();
                responseText = result.response?.replace(/<think>[\s\S]*?<\/think>/, '').trim() || 'Không có phản hồi.';
            }
        } else {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: 'qwen3:1.7b', prompt: question, stream: false })
            });

            if (!response.ok) throw new Error('Qwen API lỗi');
            const result = await response.json();
        responseText = result.response?.replace(/<think>[\s\S]*?<\/think>/, '').trim() || 'Không có câu trả lời.';
        }

        return responseText;
    } catch (error) {
        console.error('Lỗi Qwen:', error.message);
        if (error.message.includes('timeout')) return 'Lỗi hệ thống, vui lòng thử lại sau';
        throw new Error('Lỗi gọi AI');
    }
};

module.exports = { callQwen };