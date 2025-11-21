// backend/routes/authRoutes.js
const express = require('express');
const router  = express.Router();
const authCtrl = require('../controller/authcontroller.js');

router.post('/register', authCtrl.register);
router.post('/login',    authCtrl.login);

module.exports = router;
