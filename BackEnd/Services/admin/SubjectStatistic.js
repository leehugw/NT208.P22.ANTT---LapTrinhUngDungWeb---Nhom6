const Enrollment = require("../../../Database/SaveToMongo/models/Enrollment");

const getTopPopularSubjects = async () => {
    // Bước 1: Lấy tổng lượt đăng ký của từng môn
    const allSubjects = await Enrollment.aggregate([
      { $unwind: "$subject_ids" },
  
      {
        $group: {
          _id: "$subject_ids",
          totalRegistrations: { $sum: 1 }
        }
      },
  
      { $sort: { totalRegistrations: -1 } },
  
      {
        $lookup: {
          from: "subjects",
          localField: "_id",
          foreignField: "subject_id",
          as: "subject"
        }
      },
  
      { $unwind: "$subject" },
  
      {
        $project: {
          _id: 0,
          subjectId: "$_id",
          subjectName: "$subject.subject_name",
          totalRegistrations: 1
        }
      }
    ]);
  
    // Bước 2: Gom nhóm môn theo totalRegistrations
    const groupMap = {};
    for (const subject of allSubjects) {
      const key = subject.totalRegistrations;
      if (!groupMap[key]) groupMap[key] = [];
      groupMap[key].push(subject);
    }
  
    // Bước 3: Tính tổng các giá trị totalRegistrations duy nhất (lấy key làm số)
    const totalGroupRegistrations = Object.keys(groupMap)
      .reduce((sum, key) => sum + Number(key), 0);
  
    // Bước 4: Gán phần trăm cho từng môn dựa trên nhóm
    const result = [];
    for (const [registrationCount, subjects] of Object.entries(groupMap)) {
      const percent = (Number(registrationCount) / totalGroupRegistrations) * 100;
      subjects.forEach(subject => {
        result.push({
          ...subject,
          percent: percent.toFixed(2)
        });
      });
    }
  
    // Có thể muốn sắp xếp lại kết quả theo tổng đăng ký giảm dần
    result.sort((a, b) => b.totalRegistrations - a.totalRegistrations);
  
    return result;
  };
  

module.exports = { getTopPopularSubjects };