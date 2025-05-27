const EnglishCertificate = require('../../../Database/SaveToMongo/models/EnglishCertificate');

const addCertificate = async ({ studentId, type, score, imageUrl }) => {
  const newCert = new EnglishCertificate({ studentId, type, score, imageUrl });
  return await newCert.save();
};

const getCertificatesByStudent = async (studentId) => {
  return await EnglishCertificate.find({ studentId }).sort({ submittedAt: -1 });
};

module.exports = {
  addCertificate,
  getCertificatesByStudent
};
