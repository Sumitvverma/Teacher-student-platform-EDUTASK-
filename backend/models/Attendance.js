const mongoose = require('mongoose');

const attendanceLogSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  date: String,
  time: String
});

module.exports = mongoose.model('AttendanceLog', attendanceLogSchema);