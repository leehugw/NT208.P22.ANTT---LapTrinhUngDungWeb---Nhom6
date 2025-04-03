const Student = require("../../../Database/SaveToMongo/models/Student");
const Class = require("../../../Database/SaveToMongo/models/Class");
const Faculty = require("../../../Database/SaveToMongo/models/Faculty");
const Address = require("../../../Database/SaveToMongo/models/Address");
const Family = require("../../../Database/SaveToMongo/models/Family");
const Identity = require("../../../Database/SaveToMongo/models/Identity");
const Contact = require("../../../Database/SaveToMongo/models/Contact");

class StudentInformationService {
    static async getStudentProfile(student_id) {
      const student = await Student.findOne({ student_id });
      if (!student) {
        throw new Error("Không tìm thấy sinh viên");
      }
  
      const classInfo = await Class.findOne({ class_id: student.class_id });
      const faculty = await Faculty.findOne({ faculty_id: classInfo.faculty_id });
      const faculty_name = faculty.faculty_name; 
  
      const [address, family, identity, contact] = await Promise.all([
        Address.findOne({ student_id }),
        Family.findOne({ student_id }),
        Identity.findOne({ student_id }),
        Contact.findOne({ student_id })
      ]);
  
      return {
        student: {
          ...student.toObject(),
          class_name: classInfo?.class_name,
          training_system: classInfo?.training_system,
          faculty_name: faculty_name
        },
        contact: contact?.toObject() || null,
        address: address?.toObject() || null,
        family: family?.toObject() || null,
        identity: identity?.toObject() || null
      };
    }
  }
  
  module.exports = StudentInformationService;