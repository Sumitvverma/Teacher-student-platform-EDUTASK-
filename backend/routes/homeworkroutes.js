// routes/homeworkRoutes.js
 const express = require('express');
 const router  = express.Router();
const auth  = require('../middlware/auth.js');
const {
  createHomework,
  getHomeworksByClass,
  getHomeworkById,
  submitHomework,
  gradeSubmission,
  getSubmissionsByHomework
} = require('../controller/homeworkcontroller.js');

// Teacher-only
router.post('/create',auth.authMiddleware , createHomework);
router.put('/:hwId/:subId/grade', gradeSubmission);

// Authenticated users
router.get('/class/:clsId',  auth.authMiddleware , getHomeworksByClass);
router.get('/homework/:hwId', getHomeworkById);
router.get('/homework/:hwId/submissions', getSubmissionsByHomework);
router.post('/:hwId/submit' , submitHomework);

module.exports = router;
