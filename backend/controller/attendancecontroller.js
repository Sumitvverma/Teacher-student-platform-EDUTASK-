const AttendanceLog = require('../models/Attendance.js');
const jwt = require('jsonwebtoken');
const Class = require('../models/Class.js');
const { getDistanceFromLatLonInM } = require('../utils/geo.js');
const moment = require('moment');

exports.markAttendance = async (req, res) => {
  const { latitude, longitude } = req.body;
  const header = req.headers.authorization;
  const decoded = jwt.verify(header, process.env.JWT_SECRET);
  const studentId=decoded.id || decoded._id;
  const classId = req.params.classId;
// console.log(studentId,"efinfi");
  const today = moment().format('YYYY-MM-DD');
  const currentTime = moment().format('HH:mm');
// console.log(currentTime,"abhi ka samay");
  try {
    const classObj = await Class.findById(classId);
    console.log(classObj);
    const { latitude: lat, longitude: lon, radius } = classObj.geofence;
    const { startTime, endTime } = classObj.schedule;

    if (!(currentTime >= startTime && currentTime <= endTime)) {
      return res.status(400).json({ error: 'Not within scheduled time' });
    }
    //  console.log(latitude,longitude,"kaha par hai tu");
    const distance = getDistanceFromLatLonInM(latitude, longitude, lat, lon);
    //  console.log(distance,"kitna hai distance");
    if (distance > radius) {
      return res.status(400).json({ error: 'Not within geofence' });
    }

    const alreadyMarked = await AttendanceLog.findOne({ classId, student: studentId, date: today });
    if (alreadyMarked) {
      return res.status(400).json({ error: 'Already marked' });
    }

    const attendance = new AttendanceLog({
      student: studentId,
      classId,
      date: today,
      time: currentTime
    });

    await attendance.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAttendanceLogs = async (req, res) => {
  const { classId } = req.params;
  const logs = await AttendanceLog.find({ classId }).populate('student', 'name');
  res.json(logs);
};








