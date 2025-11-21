
const Homework = require('../models/Homework.js');
const jwt = require('jsonwebtoken');
// 1. Teacher creates a new homework
exports.createHomework = async (req, res) => {
  try {
    const { title, description, dueDate, classId } = req.body;

    const homework = new Homework({
      title,
      description,
      dueDate,
      classId,
      teacher: req.user.id  
    });

    await homework.save();
    res.status(201).json({ message: 'Homework created', homework });
  } catch (error) {
    console.error("Homework creation error:", error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};


// 2. Get all homeworks for a class
exports.getHomeworksByClass = async (req, res) => {
  const { clsId } = req.params;
  const homeworks = await Homework.find({ classId: clsId })
    .select('-submissions')       
    .lean();
  res.json(homeworks);
};


//get submissions with given hwid 
exports.getHomeworkById = async (req, res) => {
  try {
    const { hwId } = req.params;

  
    let userId;
    if (req.user && req.user._id){
      userId = req.user._id.toString();
    } else {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

      const token = authHeader;
      let payload;
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }
      userId = payload._id || payload.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    }

    // 3) Fetch and populate
    const hw = await Homework.findById(hwId)
      .populate('submissions.student', 'name email')
      .lean();

    if (!hw) {
      return res.status(404).json({ error: 'Homework not found' });
    }

  
    const submissions = Array.isArray(hw.submissions) ? hw.submissions : [];

  
    const rawSub = submissions.find(sub =>
      sub.student &&
      sub.student._id.toString() === userId
    ) || null;

  
    const mySubmission = rawSub
      ? {
          _id:       rawSub._id,
          content:   rawSub.content,
          status:    rawSub.status === true,
          grade:     rawSub.grade  ?? null,
          createdAt: rawSub.createdAt
        }
      : null;


    return res.json({
      _id:         hw._id,
      title:       hw.title,
      description: hw.description,
      dueDate:     hw.dueDate,
      mySubmission
    });
  } catch (err) {
    console.error('getHomeworkById error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// 4. Student submits homework
exports.submitHomework = async (req, res) => {
  try {
  
    let userId;
    if (req.user && req.user._id) {
      userId = req.user._id.toString();
    } else {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    
      const token = authHeader;
      let payload;
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }
      userId = payload._id || payload.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    }

    
    const { hwId } = req.params;
    const { content } = req.body;

  
    const hw = await Homework.findById(hwId);
    if (!hw) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    
    if (hw.submissions.some(s => s.student.toString() === userId)) {
      return res.status(400).json({ error: 'Already submitted' });
    }

    
    hw.submissions.push({ student: userId, content });
    await hw.save();
    return res.json({ success: true });
  } catch (err) {
    console.error('submitHomework error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// 5. Teacher grades a submission
exports.gradeSubmission = async (req, res) => {
  const { hwId, subId } = req.params;
  const { grade } = req.body;

  const hw = await Homework.findById(hwId);
  if (!hw) return res.status(404).json({ error: 'Homework not found' });

  
  const sub = hw.submissions.id(subId);
  if (!sub) return res.status(404).json({ error: 'Submission not found' });

  sub.status = true;
  sub.grade  = grade;
  await hw.save();
  res.json({ success: true });
};



//6. Get all submissions for one homework
exports.getSubmissionsByHomework = async (req, res) => {
  const { hwId } = req.params;
  try {
    const hw = await Homework.findById(hwId)
      .populate('submissions.student', 'name')   // pull in student name
      .lean();
    if (!hw) return res.status(404).json({ error: 'Homework not found' });
    return res.json(hw.submissions);
  } catch (err) {
    console.error('getSubmissionsByHomework error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
