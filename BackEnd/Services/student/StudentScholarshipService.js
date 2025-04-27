const ScholarshipInfo = require('../../../Database/SaveToMongo/models/ScholarshipInfo');

const getAllScholarships = async () => {
  try {
    const scholarships = await ScholarshipInfo.find();
    return scholarships;
  } catch (error) {
    throw new Error('Error fetching scholarships: ' + error.message);
  }
};

module.exports = { getAllScholarships };
