const EnglishCertificate = require('../../../Database/SaveToMongo/models/EnglishCertificate');

const addCertificate = async ({ studentId, type, imageUrl }) => {
  const newCert = new EnglishCertificate({ studentId, type, imageUrl });
  return await newCert.save();
};

const getCertificatesByStudent = async (studentId) => {
  return await EnglishCertificate.find({ studentId }).sort({ submittedAt: -1 });
};

module.exports = {
  addCertificate,
  getCertificatesByStudent
};
