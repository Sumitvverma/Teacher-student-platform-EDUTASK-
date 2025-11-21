// server/routes/classRoutes.js
const router = require('express').Router();
const { authMiddleware, authorizeRoles } = require('../middlware/auth.js');
const {
  createClass, updateClass, getClasses, joinClass,getAllClasses
} = require('../controller/classcontroller.js');

router.post('/createclass',    authMiddleware, authorizeRoles('teacher'), createClass);
router.put('/:id',  authMiddleware, authorizeRoles('teacher'), updateClass);
router.get('/getclass',     authMiddleware,                 getClasses);
router.get('/getAllclasses',     authMiddleware,                 getAllClasses);
router.post('/:id/join', authMiddleware, authorizeRoles('student'), joinClass);

module.exports = router;
