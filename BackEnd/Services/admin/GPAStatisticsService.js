const StudentAcademic = require("../../../Database/SaveToMongo/models/StudentAcademic");

const getSemesterGPAStatistics = async () => {
  const data = await StudentAcademic.aggregate([
    { $unwind: "$semester_gpas" },
    {
      $group: {
        _id: "$semester_gpas.semester_id",
        averageGPA: { $avg: "$semester_gpas.semester_gpa" },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return data.map(entry => ({
    semester_id: entry._id,
    averageGPA: parseFloat(entry.averageGPA.toFixed(2)),
    studentCount: entry.count
  }));
};

module.exports = {
  getSemesterGPAStatistics
};
