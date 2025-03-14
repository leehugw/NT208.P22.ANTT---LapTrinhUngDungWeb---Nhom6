const mongoose = require('mongoose');
const Student = require('./models/Student.js');
const Identity = require('./models/Identity.js');
const Contact = require('./models/Contact.js');
const Family = require('./models/Family.js');
const Address = require('./models/Address.js');

const studentData = require('./Json/student.json');
const identityData = require('./Json/identity.json');
const contactData = require('./Json/contact.json');
const familyData = require('./Json/family.json');
const addressData = require('./Json/address.json');

mongoose.connect('mongodb+srv://myuser:mypassword@cluster.unplw.mongodb.net/DataBase', {
}).then(() => console.log('MongoDB connected'));

const saveData = async () => {
    await Student.create(studentData);
    await Identity.create(identityData);
    await Contact.create(contactData);
    await Family.create(familyData);
    await Address.create(addressData);

    console.log('Dữ liệu đã được lưu vào MongoDB!');
    mongoose.connection.close();
};

saveData();
