const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  geofence: {
    latitude:  Number,
    longitude: Number,
    radius:    Number
  },
  schedule: {
    startTime: String, 
    endTime:   String
  },
  classcode: {
    type: String,   
    required: true,
    unique: true,   
  },
  startDate: {
    type: Date,
    required: true
  },
  students: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: []
  }
});

module.exports = mongoose.model('Class', classSchema);
