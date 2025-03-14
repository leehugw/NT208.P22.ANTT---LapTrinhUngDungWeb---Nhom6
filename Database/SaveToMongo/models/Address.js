const mongoose = require('mongoose');

// Định nghĩa Schema cho Student
const AddressSchema = new mongoose.Schema({
    student_id: String,
    permanent_address: String,
    ward: String,
    district: String,
    city: String,
    temporary_address: String
});

// Tạo model từ Schema
const Address = mongoose.model('Address', AddressSchema);

// Xuất module
module.exports = Address;