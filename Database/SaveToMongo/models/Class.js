const mongoose = require("mongoose");

const ClassSchema = new mongoose.Schema({
  class_id: { type: String, required: true, unique: true }, // ID của lớp học
  class_name: { type: String, required: true }, // Tên lớp học
  faculty_id: { type: String, required: true, ref: "Faculty" }, // ID khoa quản lý lớp
  training_system: { type: String, required: true }, // Hệ đào tạo (VD: Đại trà, Chất lượng cao)
  major_id: { type: String, required: true, ref: "Major" } // ID ngành học của lớp
}, { collection: "classes", timestamps: true });

const Class = mongoose.model("Class", ClassSchema);

module.exports = Class;
