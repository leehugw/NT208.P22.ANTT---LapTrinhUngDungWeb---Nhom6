const Lecturer = require('../../../Database/SaveToMongo/models/Lecturer');
const Faculty = require('../../../Database/SaveToMongo/models/Faculty');

class LecturerInformationService {
  static async getLecturerProfile(lecturer_id) {
    const lecturer = await Lecturer.findOne({ lecturer_id }).lean();
    if (!lecturer) {
      throw new Error("Không tìm thấy giảng viên");
    }
    
    if (lecturer.faculty_id) {
      const faculty = await Faculty.findOne({ faculty_id: lecturer.faculty_id }).lean();
      faculty_name = faculty.faculty_name;
    }

    return {
      ...lecturer.toObject(),
      faculty_name: faculty_name
    };
  }
}

module.exports = LecturerInformationService;