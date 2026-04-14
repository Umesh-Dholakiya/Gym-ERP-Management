const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userType'
  },
  userType: {
    type: String,
    required: true,
    enum: ['FullMember', 'Trainer', 'User'],
    default: 'FullMember'
  },
  date: {
    type: String, // format: YYYY-MM-DD
    required: true,
    index: true
  },
  checkInTime: {
    type: Date,
    default: Date.now,
    required: true,
  },
  checkOutTime: {
    type: Date,
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    default: 'present',
  }
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;


