const Feedback = require('../../../Database/SaveToMongo/models/Feedback');

exports.getAllFeedbacks = async () => {
  return await Feedback.find().sort({ createdAt: -1 });
};

