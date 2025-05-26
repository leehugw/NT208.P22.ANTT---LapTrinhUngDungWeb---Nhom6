const mongoose = require('mongoose');
const Student = require('./models/Student');
const { faker } = require('@faker-js/faker');

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../BackEnd/.env') });

// Kết nối MongoDB
mongoose.connect(process.env.DB_URI, {})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Cấu hình Faker cho tiếng Việt
faker.locale = 'vi';

// Danh sách nơi sinh
const birthplaces = [
  "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Cần Thơ", "Hải Phòng",
  "An Giang", "Bình Dương", "Đồng Nai", "Khánh Hòa", "Lâm Đồng",
  "Thừa Thiên Huế", "Quảng Ninh", "Thanh Hóa", "Nghệ An", "Bình Định"
];

// Danh sách dân tộc
const ethnicities = ["Kinh", "Tày", "Thái", "Hoa", "Khơ-me", "Mường", "Nùng", "H'Mông", "Dao", "Gia-rai"];

// Danh sách tôn giáo
const religions = ["Không", "Phật giáo", "Thiên chúa giáo", "Tin lành", "Cao đài", "Hòa hảo", "Hồi giáo"];

// Danh sách thành phần xuất thân
const origins = ["Cán bộ - Công chức", "Nông dân", "Công nhân", "Tiểu thương", "Doanh nhân", "Trí thức", "Nghệ sĩ"];

// Danh sách nghề nghiệp cha
const fatherJobs = [
  "Kỹ sư xây dựng", "Bác sĩ", "Giảng viên đại học", "Doanh nhân", 
  "Cán bộ nhà nước", "Kỹ sư phần mềm", "Giám đốc công ty", 
  "Trưởng phòng kinh doanh", "Chuyên viên tài chính", "Kiến trúc sư"
];

// Danh sách nghề nghiệp mẹ
const motherJobs = [
  "Giáo viên", "Bác sĩ", "Kế toán", "Nhân viên văn phòng", 
  "Kinh doanh tự do", "Y tá", "Dược sĩ", "Kiểm toán viên", 
  "Chuyên viên nhân sự", "Nội trợ"
];

// Danh sách vị trí chính quyền
const govPositions = [
  "Ủy viên ban chấp hành Đảng Bộ",
  "Phó chủ tịch UBND quận",
  "Trưởng phòng Tài chính",
  "Chánh văn phòng Sở",
  "Phó giám đốc Sở"
];

// Tạo địa chỉ Việt Nam
function generateVietnameseAddress() {
  const cities = ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Bình Dương", "Đồng Nai", "Khánh Hòa", "Huế", "Quảng Ninh"];
  const city = faker.helpers.arrayElement(cities);
  
  const districts = {
    "Hà Nội": ["Ba Đình", "Hoàn Kiếm", "Hai Bà Trưng", "Đống Đa", "Cầu Giấy"],
    "Hồ Chí Minh": ["Quận 1", "Quận 3", "Quận 5", "Quận 10", "Tân Bình"],
    "Đà Nẵng": ["Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn"],
    "Hải Phòng": ["Hồng Bàng", "Lê Chân", "Ngô Quyền", "Kiến An"],
    "Cần Thơ": ["Ninh Kiều", "Bình Thủy", "Cái Răng", "Ô Môn"]
  };
  
  const district = districts[city] 
    ? faker.helpers.arrayElement(districts[city]) 
    : `Quận ${faker.number.int({ min: 1, max: 12 })}`;
  
  const streets = [
    "Nguyễn Huệ", "Lê Lợi", "Trần Hưng Đạo", "Hai Bà Trưng", 
    "Lý Thường Kiệt", "Phạm Ngọc Thạch", "Võ Văn Tần"
  ];
  const streetName = faker.helpers.arrayElement(streets);
  
  return `Số ${faker.number.int({ min: 1, max: 200 })}, đường ${streetName}, Phường ${faker.number.int({ min: 1, max: 20 })}, ${district}, ${city}`;
}

// Xóa dấu tiếng Việt
function removeAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D");
}

// Tạo mã sinh viên
function generateStudentId(year) {
  const prefix = `${year.toString().slice(-2)}52`;
  const suffix = faker.number.int({ min: 0, max: 9999 }).toString().padStart(4, '0');
  return prefix + suffix;
}

// Tạo dữ liệu sinh viên
function generateStudentData(majorId, cohort, programType, className) {
  // Tên tiếng Việt
  const firstNamesMale = ["Nguyễn Văn", "Lê Văn", "Hoàng Văn", "Bùi Văn", "Vũ Văn", "Trần Văn", "Phạm Văn", "Đặng Văn", "Đỗ Văn", "Ngô Văn"];
  const firstNamesFemale = ["Trần Thị", "Phạm Thị", "Nguyễn Thị", "Lê Thị", "Đặng Thị", "Vũ Thị", "Hoàng Thị", "Bùi Thị", "Đỗ Thị", "Ngô Thị"];
  const lastNamesMale = ["Anh", "Bình", "Dũng", "Hiếu", "Khánh", "Minh", "Phương", "Quang", "Thành", "Việt"];
  const lastNamesFemale = ["Anh", "Chi", "Giang", "Linh", "Nga", "Phương", "Uyên", "Xuân", "Yến", "Thảo"];

  const gender = faker.helpers.arrayElement(["Male", "Female"]);
  let firstName, lastName;
  
  if (gender === "Male") {
    firstName = faker.helpers.arrayElement(firstNamesMale);
    lastName = faker.helpers.arrayElement(lastNamesMale);
  } else {
    firstName = faker.helpers.arrayElement(firstNamesFemale);
    lastName = faker.helpers.arrayElement(lastNamesFemale);
  }
  
  const name = `${firstName} ${lastName}`;
  
  // Ngày sinh
  const birthYear = cohort - 18;
  const birthMonth = faker.number.int({ min: 1, max: 12 });
  const birthDay = faker.number.int({ min: 1, max: 28 });
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
  const formattedBirthDate = `${birthDay.toString().padStart(2, '0')}-${birthMonth.toString().padStart(2, '0')}-${birthYear}`;
  
  // Thông tin sinh viên
  const studentId = generateStudentId(cohort);
  const birthplace = faker.helpers.arrayElement(birthplaces);
  const programId = `CTDT${cohort}`;
  
  // Email và điện thoại
  const schoolEmail = `${studentId}@gm.uit.edu.vn`;
  const nameNoAccents = removeAccents(name).toLowerCase().replace(/\s/g, '');
  const personalEmail = `${nameNoAccents}@gmail.com`;
  const phone = `09${faker.number.int({ min: 10000000, max: 99999999 })}`;
  
  // Địa chỉ
  const permanentAddress = generateVietnameseAddress();
  const tempAddress = faker.datatype.boolean() 
    ? "Ký túc xá đại học quốc gia thành phố Hồ Chí Minh, Số 6, Phường Linh Trung, Quận Thủ Đức, Thành phố Hồ Chí Minh"
    : generateVietnameseAddress();
  
  // Thông tin căn cước
  const identityNumber = faker.number.int({ min: 100000000, max: 999999999 }).toString().padStart(12, '0');
  const issueDate = new Date(2010, 0, 1);
  issueDate.setDate(issueDate.getDate() + faker.number.int({ min: 0, max: 3650 }));
  const formattedIssueDate = `${issueDate.getDate().toString().padStart(2, '0')}-${(issueDate.getMonth() + 1).toString().padStart(2, '0')}-${issueDate.getFullYear()}`;
  
  // Thông tin gia đình
  const maleLastNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng"];
  const femaleLastNames = ["Nguyễn Thị", "Trần Thị", "Lê Thị", "Phạm Thị", "Hoàng Thị", "Huỳnh Thị", "Phan Thị"];
  const middleNames = ["Văn", "Quang", "Đức", "Minh", "Hữu", "Công", "Thanh", "Duy", "Anh", "Bảo"];
  const firstNames = ["A", "B", "C", "D", "E", "F", "G", "H", "K", "L", "M", "N", "P", "Q", "S", "T"];
  
  // Thông tin cha
  const fatherLast = faker.helpers.arrayElement(maleLastNames);
  const fatherMiddle = faker.helpers.arrayElement(middleNames);
  const fatherFirst = faker.helpers.arrayElement(firstNames);
  const fatherName = `${fatherLast} ${fatherMiddle} ${fatherFirst}`;
  
  let fatherJob;
  if (Math.random() < 0.3) {
    fatherJob = `${faker.helpers.arrayElement(govPositions)}; ${faker.helpers.arrayElement(fatherJobs)}`;
  } else {
    fatherJob = faker.helpers.arrayElement(fatherJobs);
  }
  
  const fatherPhone = `09${faker.number.int({ min: 10000000, max: 99999999 })}`;
  const fatherAddress = generateVietnameseAddress();
  
  // Thông tin mẹ
  const motherLast = faker.helpers.arrayElement(femaleLastNames);
  const motherFirst = faker.helpers.arrayElement(firstNames);
  const motherName = `${motherLast} ${motherFirst}`;
  const motherJob = faker.helpers.arrayElement(motherJobs);
  const motherPhone = `09${faker.number.int({ min: 10000000, max: 99999999 })}`;
  const motherAddress = Math.random() < 0.8 ? fatherAddress : generateVietnameseAddress();
  
  // Thông tin người giám hộ (10% có)
  let guardianName = '', guardianPhone = '', guardianAddress = '';
  if (Math.random() < 0.1) {
    guardianName = `${faker.helpers.arrayElement([...maleLastNames, ...femaleLastNames])} ${faker.helpers.arrayElement(firstNames)}`;
    guardianPhone = `09${faker.number.int({ min: 10000000, max: 99999999 })}`;
    guardianAddress = generateVietnameseAddress();
  }
  
  // Ngày vào đoàn (100% có)
  const unionJoinDate = new Date(2020, 0, 1);
  unionJoinDate.setDate(unionJoinDate.getDate() + faker.number.int({ min: 0, max: 1095 }));
  const formattedUnionJoinDate = `${unionJoinDate.getDate().toString().padStart(2, '0')}-${(unionJoinDate.getMonth() + 1).toString().padStart(2, '0')}-${unionJoinDate.getFullYear()}`;
  
  // Ngày vào đảng (30% có)
  let partyJoinDate = '';
  if (Math.random() < 0.3) {
    const partyDate = new Date(2020, 0, 1);
    partyDate.setDate(partyDate.getDate() + faker.number.int({ min: 0, max: 1095 }));
    partyJoinDate = `${partyDate.getDate().toString().padStart(2, '0')}-${(partyDate.getMonth() + 1).toString().padStart(2, '0')}-${partyDate.getFullYear()}`;
  }
  
  // Tạo đối tượng sinh viên
  const student = {
    student_id: studentId,
    name: name,
    gender: gender,
    birth_date: formattedBirthDate,
    birthplace: birthplace,
    class_id: className,
    major_id: majorId,
    program_id: programId,
    program_type: programType,
    has_english_certificate: Math.random() < 0.3,
    contact: {
      school_email: schoolEmail,
      alias_email: "",
      personal_email: personalEmail,
      phone: phone
    },
    address: {
      permanent_address: permanentAddress,
      temporary_address: tempAddress
    },
    identity: {
      identity_number: identityNumber,
      identity_issue_date: formattedIssueDate,
      identity_issue_place: "Cục cảnh sát ĐKQL cư trú và DLQG về dân cư",
      ethnicity: Math.random() < 0.8 ? "Kinh" : faker.helpers.arrayElement(ethnicities.slice(1)),
      religion: Math.random() < 0.7 ? "Không" : faker.helpers.arrayElement(religions.slice(1)),
      origin: faker.helpers.arrayElement(origins),
      union_join_date: formattedUnionJoinDate,
      party_join_date: partyJoinDate
    },
    family: {
      father: {
        name: fatherName,
        job: fatherJob,
        phone: fatherPhone,
        address: fatherAddress
      },
      mother: {
        name: motherName,
        job: motherJob,
        phone: motherPhone,
        address: motherAddress
      },
      guardian: {
        name: guardianName,
        phone: guardianPhone,
        address: guardianAddress
      }
    }
  };
  
  return student;
}

async function generateStudents(numStudents = 300) {
  try {
    await mongoose.connection.dropCollection('students'); // Xóa hoàn toàn collection cũ
    
    const students = [];
    const cohorts = [2021, 2022, 2023, 2024];
    const majors = ["ATTT", "MMTT", "CNTT", "HTTT", "KHMT", "TTNT", "KTPM", "KTMT", "TMDT", "KHDL", "TKVM"];
    const programTypes = ["CQUI", "CNTN"];

    // Tạo trước 300 student_id duy nhất, kèm cohort
    const studentIdCohorts = [];
    const studentIdSet = new Set();
    while (studentIdCohorts.length < numStudents) {
      const cohort = faker.helpers.arrayElement(cohorts);
      const id = generateStudentId(cohort);
      if (!studentIdSet.has(id)) {
        studentIdSet.add(id);
        studentIdCohorts.push({ id, cohort });
      }
    }

    // Tạo sinh viên với các ID đã chuẩn bị
    for (let i = 0; i < numStudents; i++) {
      const { id: studentId, cohort } = studentIdCohorts[i];
      const programType = faker.helpers.arrayElement(programTypes);
      const classNum = faker.helpers.arrayElement([1, 2]);
      let majors;
      if (cohort < 2023) {
        majors = ["ATTT", "MMTT", "CNTT", "HTTT", "KHMT", "KTPM", "KTMT", "TMDT", "KHDL"];
      } else if (cohort === 2023) {
        majors = ["ATTT", "MMTT", "CNTT", "HTTT", "KHMT", "TTNT", "KTPM", "KTMT", "TMDT", "KHDL"];
      } else {
        majors = ["ATTT", "MMTT", "CNTT", "HTTT", "KHMT", "TTNT", "KTPM", "KTMT", "TMDT", "KHDL", "TKVM"];
      }

      let majorId, className;
      if (programType === "CNTN") {
        // Lớp tài năng
        if (Math.random() < 0.2 && majors.includes("ATTT")) {
          majorId = "ATTT";
          className = `ATTN${cohort}.${classNum}`;
        } else {
          if (majors.includes("KHMT")) {
            majorId = "KHMT";
            className = `KHTN${cohort}.${classNum}`;
        }
        }
      } else {
        // Lớp thường
        majorId = faker.helpers.arrayElement(majors);
        className = `${majorId}${cohort}.${classNum}`;
      }

      const student = generateStudentData(majorId, cohort, programType, className);
      student.student_id = studentId; // Đảm bảo đúng cohort
      students.push(student);
    }

    // Chèn dữ liệu với bulk operation để tăng tốc độ
    const batchSize = 100;
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      await Student.insertMany(batch);
      console.log(`Đã chèn ${Math.min(i + batchSize, students.length)}/${students.length} sinh viên`);
    }

    // Xác minh kết quả
    const finalCount = await Student.countDocuments();
    if (finalCount === numStudents) {
      console.log(`✅ Đã tạo chính xác ${finalCount} sinh viên`);
    } else {
      console.warn(`⚠️ Số lượng sinh viên (${finalCount}) không khớp với yêu cầu (${numStudents})`);
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Lỗi khi tạo sinh viên:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

generateStudents();