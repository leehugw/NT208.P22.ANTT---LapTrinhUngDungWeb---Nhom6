const Lecturer = require('../../../Database/SaveToMongo/models/Lecturer');

class LecturerInformationService {
  static async getLecturerProfile(lecturer_id) {
    const lecturer = await Lecturer.findOne({ lecturer_id });
    if (!lecturer) {
      throw new Error("Không tìm thấy giảng viên");
    }

    return lecturer.toObject();
  }
}

module.exports = LecturerInformationService;