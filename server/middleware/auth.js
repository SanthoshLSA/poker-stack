const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authorized, no session token' });
    }

    const userId = authHeader.split(' ')[1];
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ error: 'Session user not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Not authorized, invalid session' });
  }
};

module.exports = { protect };
