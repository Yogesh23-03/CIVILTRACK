const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isCivicTrackAdminEmail = (email = '') => email.toLowerCase().endsWith('@civictrack.com');

module.exports = async (req, res, next) => {
  const authHeader = req.header('Authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = req.header('x-auth-token') || bearerToken;
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    let role = decoded.role;
    let email = decoded.email;

    if (!email || isCivicTrackAdminEmail(email)) {
      const user = await User.findById(decoded.id).select('email role ward name');
      if (user) {
        email = user.email;
        role = user.role === 'admin' || isCivicTrackAdminEmail(user.email) ? 'admin' : user.role;
      }
    }

    req.user = { ...decoded, email, role };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
