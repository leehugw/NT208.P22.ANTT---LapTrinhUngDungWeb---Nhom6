//StudentInformationService.js
const Student = require("../../../Database/SaveToMongo/models/Student");
const Faculty = require("../../../Database/SaveToMongo/models/Faculty");
const { NotFoundError, DatabaseError } = require('../../../BackEnd/Services/student/errors.js'); // điều chỉnh đường dẫn phù hợp

class StudentInformationService {
  static async getStudentProfile(student_id) {
    try {
      const student = await Student.findOne({ student_id }).lean();
      if (!student) throw new NotFoundError('Không tìm thấy sinh viên');
  
      let faculty_name = null;
      
      if (student.major_id) {
        // Tìm tất cả các khoa có chứa major_id của sinh viên
        const faculties = await Faculty.find({
          $or: [
            { majors: student.major_id },       // Tìm trong mảng majors
            { faculty_id: `KHOA_${student.major_id}` } // Tìm theo faculty_id
          ]
        }).lean();
  
        // Lấy khoa đầu tiên tìm thấy (hoặc có thể xử lý phức tạp hơn nếu cần)
        const faculty = faculties[0];
        
        faculty_name = faculty?.faculty_name || null;
      }
  
      return {
        student: {
          ...student,
          faculty_name: faculty_name || 'Chưa xác định'
        },
        contact: student.contact || null,
        address: student.address || null,
        identity: student.identity || null,
        family: student.family || null,
        major_id: student.major_id || null,
      };
    } catch (error) {
      console.error('Lỗi khi lấy thông tin sinh viên:', error);
      throw new DatabaseError('Không thể lấy thông tin hồ sơ sinh viên');
    }
  }
}

module.exports = StudentInformationService;
