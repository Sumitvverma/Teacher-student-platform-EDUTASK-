const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeRoles } = require('../middlware/auth.js');
const { markAttendance, getAttendanceLogs } = require('../controller/attendancecontroller.js');

// Student marks attendance
router.post(
  '/:classId/mark',
  authMiddleware,
  authorizeRoles('student'),
  markAttendance
);
// student views logs for a class
router.get(
  '/:classId/logs',
  getAttendanceLogs
);






module.exports = router;