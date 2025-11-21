// models/Homework.js
const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  dueDate: {
    type: Date,
    required: true
  },
  submissions: [
    {
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true
      },
      submittedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: Boolean,
        default: false   
      },
      grade: {
        type: Number,
        default: null     
      }
    }
  ]
}, {
  timestamps: true    
});

module.exports = mongoose.model('Homework', homeworkSchema);
