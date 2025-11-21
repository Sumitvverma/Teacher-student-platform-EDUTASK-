const Class = require('../models/Class.js'); 
const User = require('../models/user.js');
function generateClassCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}


exports.createClass = async (req, res) => {
  try {
    const { name, geofence, schedule, startDate } = req.body;

  
    if (!name || !geofence || !schedule || !startDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const classCode = generateClassCode();

    const newClass = new Class({
      name,
      teacher: req.user.id,
      geofence: {
        latitude:  geofence.latitude,
        longitude: geofence.longitude,
        radius:    geofence.radius
      },
      schedule: {
        startTime: schedule.startTime,
        endTime:   schedule.endTime
      },
       classcode: classCode,
      startDate: new Date(startDate),  
      students: []
    });

    await newClass.save();
    res.status(201).json(newClass);

  } catch (err) {
    console.error('createClass error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};




exports.updateClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ error: 'Class not found' });

    
    if (cls.teacher.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { name, geofence, schedule } = req.body;
    if (name) cls.name = name;
    if (geofence) {
      cls.geofence.latitude  = geofence.latitude;
      cls.geofence.longitude = geofence.longitude;
      cls.geofence.radius    = geofence.radius;
    }
    if (schedule) {
      cls.schedule.startTime = schedule.startTime;
      cls.schedule.endTime   = schedule.endTime;
    }

    const updated = await cls.save();
    res.json(updated);
  } catch (err) {
    console.error('updateClass error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.getClasses = async (req, res) => {
  try {
    let classes;
    if (req.user.role === 'teacher') {
      
      classes = await Class.find({ teacher: req.user.id })
        .populate('teacher', 'name email');
    } else if (req.user.role === 'student') {
    
      classes = await Class.find({ students: req.user.id })
        .populate('teacher', 'name email');
    }
    res.json(classes);
  } catch (err) {
    console.error('getClasses error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};




exports.joinClass = async (req, res) => {
  try {
    const { classCode } = req.body;
    const classId = req.params.id;
//  console.log(classCode,"code aaya ki nahi")
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const cls = await Class.findById(classId);
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    if (!Array.isArray(cls.students)) {
      cls.students = [];
    }

    const userId = req.user.id;

    if (cls.students.some(id => id.toString() === userId)) {
      return res.status(400).json({ error: 'Already joined' });
    }

    if (cls.classcode.trim() !== classCode.trim()) {
      prompt("Entered Class code is wrong");
      return res.status(400).json({ error: 'Entered Class code is wrong' });
    }

    cls.students.push(userId);
    await cls.save();

    res.json({ message: 'Joined class' });
  } catch (err) {
    console.error('joinClass error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.getAllClasses = async (req, res) => {
  try {
    // Fetch every class, and populate teacher name+email
    const classes = await Class.find()
      .populate('teacher', 'name email');
    return res.json(classes);
  } catch (err) {
    console.error('getAllClasses error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};