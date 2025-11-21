const jwt = require('jsonwebtoken');
require('dotenv').config();
exports.authMiddleware = (req, res, next) => {
  const header = req.headers.authorization ;
  // console.log(header,"fffff");
  if (!header) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token =header;
  try {
    // console.log(token,"dddd")
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch(err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

exports.authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};