const Score = require('../../../Database/SaveToMongo/models/Score');
const TrainingProgram = require('../../../Database/SaveToMongo/models/TrainingProgram');
const ScholarshipInfo = require('../../../Database/SaveToMongo/models/ScholarshipInfo');

const callQwen = async (question, student_id, retries = 2) => {
  const url = 'http://localhost:11434/api/generate';
  try {
    if (!student_id) throw new Error('Không tìm thấy mã số sinh viên');

    let responseText = 'Không có câu trả lời';

    const majorMap = {
      "khoa học dữ liệu": "KHDL",
      "thương mại điện tử": "TMDT",
      "an toàn thông tin": "ATTT",
      "mạng máy tính và": "MMTT",
      "kỹ thuật máy tính": "KTMT",
      "kỹ thuật phần mềm": "KTPM",
      "khoa học máy tính": "KHMT",
      "hệ thống thông tin": "HTTT",
      "công nghệ thông tin": "CNTT",
      "trí tuệ nhân tạo": "TTNT",
      "thiết kế vi mạch": "TKVM"
    };

    if (question.toLowerCase().includes('điểm học kỳ') || question.toLowerCase().includes('điểm của tôi')) {
      const rawDocs = await Score.find({ student_id }).lean();

      if (!rawDocs.length) {
        responseText = `Không tìm thấy điểm cho sinh viên có mã ${student_id}. Vui lòng kiểm tra database hoặc liên hệ phòng đào tạo.`;
      } else {
        // Tính điểm trung bình
        let qtSum = 0, gkSum = 0, thSum = 0, ckSum = 0, hpSum = 0;
        let qtCount = 0, gkCount = 0, thCount = 0, ckCount = 0, hpCount = 0;

        rawDocs.forEach((doc) => {
          if (typeof doc.score_QT === 'number' && !isNaN(doc.score_QT)) {
            qtSum += doc.score_QT;
            qtCount++;
          }
          if (typeof doc.score_GK === 'number' && !isNaN(doc.score_GK)) {
            gkSum += doc.score_GK;
            gkCount++;
          }
          if (typeof doc.score_TH === 'number' && !isNaN(doc.score_TH)) {
            thSum += doc.score_TH;
            thCount++;
          }
          if (typeof doc.score_CK === 'number' && !isNaN(doc.score_CK)) {
            ckSum += doc.score_CK;
            ckCount++;
          }
          if (typeof doc.score_HP === 'string' && doc.score_HP.toLowerCase() !== 'miễn') {
            const hpValue = parseFloat(doc.score_HP);
            if (!isNaN(hpValue) && hpValue >= 0 && hpValue <= 10) {
              hpSum += hpValue;
              hpCount++;
            } else {
              console.log(`Invalid score_HP value: ${doc.score_HP} for student_id: ${doc.student_id}`);
            }
          } else {
            console.log(`score_HP skipped (value: ${doc.score_HP}) for student_id: ${doc.student_id}`);
          }
        });

        const averages = {
          score_QT: qtCount ? (qtSum / qtCount).toFixed(2) : 'Chưa có',
          score_GK: gkCount ? (gkSum / gkCount).toFixed(2) : 'Chưa có',
          score_TH: thCount ? (thSum / thCount).toFixed(2) : 'Chưa có',
          score_CK: ckCount ? (ckSum / ckCount).toFixed(2) : 'Chưa có',
          score_HP: hpCount ? (hpSum / hpCount).toFixed(2) : 'Chưa có'
        };

        const prompt = `Nhận xét chi tiết bằng tiếng Việt về điểm trung bình của sinh viên (mã ${student_id}) dựa trên các điểm sau: Điểm quá trình: ${averages.score_QT}, Điểm giữa kì: ${averages.score_GK}, Điểm thực hành: ${averages.score_TH}, Điểm cuối kì: ${averages.score_CK}, Điểm học phần: ${averages.score_HP}. Gợi ý cải thiện rõ ràng, kỹ càng nếu điểm trung bình dưới 7.0.`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'qwen3:4b', prompt, stream: false })
        });

      //  console.log(`API phản hồi sau: ${Date.now() - startTime}ms`);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Qwen API lỗi: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        if (!result.response) {
          throw new Error('API trả về không có trường response');
        }
        responseText = result.response.replace(/<think>[\s\S]*?<\/think>/g, '').trim() || 'Không có phản hồi.';
      }
    } 
    
    else if (question.toLowerCase().includes('ngành') && question.toLowerCase().includes('chương trình đào tạo')) {
      // Tìm năm
      const yearMatch = question.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0]) : null;

      if (!year || year < 2021 || year > 2024) {
        responseText = 'Vui lòng cung cấp năm hợp lệ trong khoảng 2021-2024, ví dụ: "Chương trình đào tạo ngành Công nghệ thông tin năm 2023 có bao nhiêu tín chỉ?"';
      } else {
        const programId = `CTDT${year}`;

        // Lấy 4 từ sau "ngành"
        const questionLower = question.toLowerCase();
        const industryIndex = questionLower.indexOf('ngành');
        if (industryIndex === -1) {
          responseText = 'Không tìm thấy từ "ngành" trong câu hỏi.';
        } else {
          const words = questionLower
            .slice(industryIndex + 5)
            .replace(/[.,!?]/g, '')
            .split(' ')
            .filter(word => word.length > 0)
            .slice(0, 4);

          if (words.length < 1) {
            responseText = 'Không thể xác định ngành.';
          } else {
            let majorId = null;
            let majorName = null;
            for (let i = 4; i >= 1; i--) {
              const phrase = words.slice(0, i).join(' ');
              if (majorMap[phrase]) {
                majorId = majorMap[phrase];
                majorName = phrase;
                break;
              }
            }

            if (!majorId) {
              responseText = `Không tìm thấy ngành phù hợp với "${words.join(' ')}" trong năm ${year}. Vui lòng hỏi cụ thể hơn.`;
            } else {
              console.log(`Tìm ngành: ${majorName} (mã: ${majorId}) cho năm ${year}`);

              // Truy vấn database chỉ bằng major_id
              const trainingDocs = await TrainingProgram.find({
                program_id: programId,
                cohort: year,
                'majors.major_id': majorId
              })
                .select('name majors.major_id majors.major_name majors.training_credits majors.progress_details')
                .limit(1)
                .lean();

              if (!trainingDocs.length || !trainingDocs[0].majors.length) {
                responseText = `Không tìm thấy thông tin ngành (mã: ${majorId}) cho năm ${year}. Vui lòng kiểm tra database.`;
              } else {
                const major = trainingDocs[0].majors.find(m => m.major_id === majorId);
                const context = `Chương trình: ${trainingDocs[0].name}\n- Ngành: ${major.major_name} (mã: ${major.major_id})\n  Tổng tín chỉ: ${major.training_credits}\n  Tín chỉ đại cương: ${major.progress_details.required_general_education}\n  Tín chỉ cốt lõi: ${major.progress_details.required_major_core}\n  Tín chỉ nền tảng: ${major.progress_details.required_major_foundation}\n  Tín chỉ đồ án: ${major.progress_details.required_graduation_project}\n  Tín chỉ tự chọn: ${major.progress_details.required_elective_credits}\n`;

                const prompt = `Dựa trên thông tin sau:\n${context}\nTrả lời câu hỏi "${question}" bằng tiếng Việt, rõ ràng, đầy đủ các loại tín chỉ được cung cấp`;
                

                const response = await fetch(url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ model: 'qwen3:4b', prompt, stream: false })
                });

                if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(`Qwen API lỗi: ${response.status} - ${errorText}`);
                }

                const result = await response.json();
                if (!result.response) {
                  throw new Error('API trả về không có trường response');
                }
                responseText = result.response.replace(/<think>[\s\S]*?<\/think>/g, '').trim() || 'Không có phản hồi.';
              }
            }
          }
        }
      }
    }
    
    // Xử lý câu hỏi về học bổng
    else if (question.toLowerCase().includes('có bao nhiêu loại học bổng')) {
            // Truy vấn danh sách học bổng
            const scholarships = await ScholarshipInfo.find({}, { scholarship_name: 1, _id: 0 }).lean();
            console.log('Scholarships:', JSON.stringify(scholarships, null, 2));

            const scholarshipNames = scholarships.map(s => s.scholarship_name);
            const scholarshipCount = scholarshipNames.length;

            if (!scholarshipCount) {
                responseText = 'Hiện tại không có thông tin về học bổng nào trong hệ thống.';
            } else {
                // Tạo prompt cho Qwen
                const prompt = `Có ${scholarshipCount} loại học bổng với các tên sau: ${scholarshipNames.join(', ')}. Hãy trả lời ngắn gọn bằng tiếng Việt về số lượng và tên các loại học bổng này.`;

                const response = await fetch(url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ model: 'qwen3:4b', prompt, stream: false })
                });

                if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(`Qwen API lỗi: ${response.status} - ${errorText}`);
                }

                const result = await response.json();
                if (!result.response) {
                  throw new Error('API trả về không có trường response');
                }
                responseText = result.response.replace(/<think>[\s\S]*?<\/think>/g, '').trim() || 'Không có phản hồi.';
            }
        }

    else {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'qwen3:4b', prompt: question, stream: false })
      });

     // console.log(`API phản hồi sau: ${Date.now() - startTime}ms`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Qwen API lỗi: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      if (!result.response) throw new Error('API trả về không có trường response');
      responseText = result.response.replace(/<think>[\s\S]*?<\/think>/g, '').trim() || 'Không có câu trả lời.';
    }

    return responseText;
  } catch (error) {
    console.error('Lỗi Qwen:', error.message, error.stack);
    throw new Error(`Lỗi gọi AI: ${error.message}`);
  }
};

module.exports = { callQwen };