const jwt = require('jsonwebtoken');
const { Sequelize } = require('sequelize');
const config = require('../config/config.json');

// Initialize database connection
const sequelize = new Sequelize(config.development);

// Import models
const Buyer = require('../models/buyer')(sequelize, Sequelize.DataTypes);
const Seller = require('../models/seller')(sequelize, Sequelize.DataTypes);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token:', decoded);

    // Check if user exists (only for buyer/seller, not admin)
    if (decoded.role !== 'admin') {
      let user = null;
      if (decoded.role === 'buyer') {
        user = await Buyer.findByPk(decoded.userId);
      } else if (decoded.role === 'seller') {
        user = await Seller.findByPk(decoded.userId);
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      req.user = {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: decoded.role
      };
    } else {
      // For admin users, use the decoded token directly
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        role: decoded.role
      };
    }

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Admin token required'
      });
    }

    // For testing purposes, accept mock admin token
    if (token === 'admin-mock-token') {
      req.user = {
        userId: 'admin-mock-id',
        email: 'admin@escrowx.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      };
      return next();
    }

    // Verify real admin token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      role: 'admin'
    };

    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid admin token'
    });
  }
};

// Role-based authorization
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authenticateAdmin,
  authorizeRole
}; 