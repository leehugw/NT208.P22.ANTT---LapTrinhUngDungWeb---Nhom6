const Feedback = require('../models/Feedback');

exports.saveFeedback = async (feedbackData) => {
  const newFeedback = new Feedback(feedbackData);
  await newFeedback.save();
};

exports.getFeedbacks = async () => {
  return await Feedback.find().sort({ createdAt: -1 });
};
