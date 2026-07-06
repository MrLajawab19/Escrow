const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ── Authentication middleware ──────────────────────────────────────────────────

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify user still exists in DB (buyer/seller only — admin skips DB check)
    if (decoded.role !== 'admin') {
      let user = null;
      if (decoded.role === 'buyer') {
        user = await prisma.buyer.findUnique({ where: { id: decoded.id } });
      } else if (decoded.role === 'seller') {
        user = await prisma.seller.findUnique({ where: { id: decoded.id } });
      }

      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      req.user = {
        userId: user.id,
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: decoded.role,
      };
    } else {
      req.user = {
        userId: decoded.id,
        id: decoded.id,
        email: decoded.email,
        firstName: decoded.firstName || '',
        lastName: decoded.lastName || '',
        role: 'admin',
      };
    }

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ── Admin-specific authentication middleware ───────────────────────────────────

const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Admin token required' });
    }

    // Accept mock admin token for testing
    if (token === 'admin-mock-token') {
      req.user = {
        userId: 'admin-mock-id',
        id: 'admin-mock-id',
        email: 'admin@scrowx.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      };
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    // Verify admin exists in DB
    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } }).catch(() => null);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin not found' });
    }

    req.user = {
      userId: admin.id,
      id: admin.id,
      email: admin.email,
      firstName: admin.name,
      lastName: '',
      role: 'admin',
    };

    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(401).json({ success: false, message: 'Invalid admin token' });
  }
};

// ── Role-based authorization ───────────────────────────────────────────────────

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticateToken, authenticateAdmin, authorizeRole };