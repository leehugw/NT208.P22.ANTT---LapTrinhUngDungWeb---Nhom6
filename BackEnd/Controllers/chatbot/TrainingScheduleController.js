const TrainingScheduleService = require('../../Services/chatbot/TrainingScheduleService');

const getAllTrainingSchedules = async (req, res) => {
  try {
    const schedules = await TrainingScheduleService.getAllTrainingSchedules();
    res.status(200).json(schedules);
  } catch (error) {
    console.error('Error getting training schedules:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTrainingScheduleByAcademicYear = async (req, res) => {
  try {
    const { academicYear } = req.params;
    const schedule = await TrainingScheduleService.getTrainingScheduleByAcademicYear(academicYear);

    if (!schedule) {
      return res.status(404).json({ message: 'Training schedule not found for this academic year' });
    }

    res.status(200).json(schedule);
  } catch (error) {
    console.error('Error getting training schedule by academic year:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllTrainingSchedules,
  getTrainingScheduleByAcademicYear
};
