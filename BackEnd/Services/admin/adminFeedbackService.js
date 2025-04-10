
exports.getAllFeedbacks = async () => {
  const db = getDB();
  const feedbacksCollection = db.collection('feedbacks');
  return await feedbacksCollection.find({}).toArray();
};
