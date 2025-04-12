const { get } = require("mongoose");
const Score = require("../../../Database/SaveToMongo/models/Score");

const getScoresByStudentGrouped = async (student_id) => {
  return await Score.aggregate([
    { $match: { student_id: student_id.toString() } },
    {
      $lookup: {
        from: "subjects",
        localField: "subject_id",
        foreignField: "subject_id",
        as: "subject"
      }
    },
    {
      $lookup: {
        from: "semesters",
        localField: "semester_id",
        foreignField: "semester_id",
        as: "semester"
      }
    },
    { $unwind: "$subject" },
    { $unwind: "$semester" },
    {
      $group: {
        _id: "$semester.semester_id",
        semester: { $first: "$semester" },
        subjects: {
          $push: {
            subject_code: "$subject.subject_id",
            subject_name: "$subject.subject_name",
            score_QT: "$score_QT",
            score_GK: "$score_GK",
            score_TH: "$score_TH",
            score_CK: "$score_CK",
            score_HP: "$score_HP",
            status: "$status"
          }
        }
      }
    },
    {
      $sort: {
        "semester.start_year": 1,
        "semester.semester_id": 1
      }
    }
  ]);
};

module.exports = {
  getScoresByStudentGrouped
};
