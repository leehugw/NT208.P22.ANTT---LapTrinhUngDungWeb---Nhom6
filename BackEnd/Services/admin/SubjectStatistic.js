const Enrollment = require("../../../Database/SaveToMongo/models/Enrollment");

const getTopPopularSubjects = async () => {
  // Lấy tổng lượt đăng ký của từng môn
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

  // Tính tổng tất cả lượt đăng ký
  const totalRegistrationsAll = allSubjects.reduce((sum, subject) => sum + subject.totalRegistrations, 0);

  // Gán phần trăm cho từng môn
  const result = allSubjects.map(subject => ({
    ...subject,
    percent: ((subject.totalRegistrations / totalRegistrationsAll) * 100).toFixed(2)
  }));

  return result;
};

module.exports = { getTopPopularSubjects };
