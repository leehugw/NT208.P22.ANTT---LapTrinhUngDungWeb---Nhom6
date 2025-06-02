  const mongoose = require('mongoose');

  const notificationSchema = new mongoose.Schema({
    student_id: {type:String, required:true},
    read: { type: Boolean, default: false } // trạng thái đã đọc
  },{collection:"notifications", timestamps: true });

  const Notification = mongoose.model('Notification', notificationSchema);

  module.exports = Notification;
