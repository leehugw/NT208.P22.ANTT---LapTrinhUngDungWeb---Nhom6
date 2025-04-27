const TrainingSchedule = require('../../../Database/SaveToMongo/models/TrainingSchedule');

const getAllTrainingSchedules = async () => {
  return await TrainingSchedule.find();
};

const getTrainingScheduleByAcademicYear = async (academicYear) => {
  return await TrainingSchedule.findOne({ academicYear });
};

module.exports = {
  getAllTrainingSchedules,
  getTrainingScheduleByAcademicYear
};
