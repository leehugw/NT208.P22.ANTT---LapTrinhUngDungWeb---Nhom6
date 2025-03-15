const mongoose = require('mongoose');
const Student = require('./models/Student.js');
const Identity = require('./models/Identity.js');
const Contact = require('./models/Contact.js');
const Family = require('./models/Family.js');
const Address = require('./models/Address.js');

const Score = require('./models/Score.js');
const Semester = require('./models/Semester.js');
const Semester_gpa = require('./models/Semester_gpa.js');
const Student_gpa = require('./models/Student_gpa.js');

const studentData = require('./Json/student.json');
const identityData = require('./Json/identity.json');
const contactData = require('./Json/contact.json');
const familyData = require('./Json/family.json');
const addressData = require('./Json/address.json');

const scoreData = require('./Json/score.json');
const semesterData = require('./Json/semester.json');
const semesterGPAData = require('./Json/semester_gpa.json');
const studentGPAData = require('./Json/student_gpa.json'); 

mongoose.connect('X', {
}).then(() => console.log('MongoDB connected'));

const saveData = async () => {
    //await Student.create(studentData);
    //await Identity.create(identityData);
    //await Contact.create(contactData);
    //await Family.create(familyData);
    //await Address.create(addressData);

    await Score.insertMany(scoreData);
    await Semester.insertMany(semesterData);
    await Student_gpa.insertMany(studentGPAData);
    await Semester_gpa.insertMany(semesterGPAData);

    console.log('Dữ liệu đã được lưu vào MongoDB!');
    mongoose.connection.close();
};

saveData();
