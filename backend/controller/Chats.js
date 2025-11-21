// routes/chat.js
const express = require('express');
const router  = express.Router();
const Message = require('../models/Message');

router.get('/:classCode/history', async (req, res) => {
  const { classCode } = req.params;
  const history = await Message
    .find({ classCode })
    .sort({ timestamp: 1 }); 
    //console.log(history,"info de da")    
  res.json(history);
});

module.exports = router;
