const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  category_name: { type: String, required: true }, // tên của danh mục
  conditions: [{ type: String, required: true }] // điều kiện
}, { _id: false });

const EligibilitySchema = new mongoose.Schema({
  target: { type: String, required: true }, // đối tượng được cấp học bổng
  requirements: [{ type: String, required: true }] // yêu cầu
}, { _id: false });

const ScholarshipInfoSchema = new mongoose.Schema({
  scholarship_name: { type: String, required: true }, // tên học bổng
  type: { type: String, required: true }, // loại học bổng
  description: { type: String, required: true }, // mô tả học bổng
  categories: { type: [CategorySchema], required: true }, // danh sách các danh mục
  eligibility: { type: EligibilitySchema, required: true } // điều kiện đủ để nhận học bổng
}, { collection: 'scholarship_info' }); 

module.exports = mongoose.model('ScholarshipInfo', ScholarshipInfoSchema);
