const admin = require('../config/firebase');
const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify our custom JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user data to request from our decoded token
    req.user = {
      uid: decoded.uid,
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({
      error: 'Invalid token',
      message: error.message
    });
  }
};

module.exports = {
  verifyToken
}; 