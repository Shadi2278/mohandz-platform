// Authentication Middleware for Mohandz Admin Dashboard

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'mohandz-secret-key';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request object
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح، يرجى تسجيل الدخول'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user by id
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }
    
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'الحساب غير مفعل'
      });
    }
    
    // Attach user to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    return res.status(401).json({
      success: false,
      message: 'غير مصرح، يرجى تسجيل الدخول مرة أخرى'
    });
  }
};

/**
 * Role-based authorization middleware
 * Checks if user has required role
 * @param {Array} roles - Array of allowed roles
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح، يرجى تسجيل الدخول'
      });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح، ليس لديك صلاحية كافية'
      });
    }
    
    next();
  };
};

module.exports = {
  auth,
  authorize
};
