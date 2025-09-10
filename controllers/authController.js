const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { Sequelize } = require('sequelize');
const config = require('../config/config.json');

// Initialize database connection
//const sequelize = new Sequelize(config.development);
const env = process.env.NODE_ENV || 'development';
const sequelize = new Sequelize(config[env]);

// Import models
const Buyer = require('../models/buyer')(sequelize, Sequelize.DataTypes);
const Seller = require('../models/seller')(sequelize, Sequelize.DataTypes);

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Buyer Signup
async function buyerSignup(req, res) {
  try {
    const { email, password, firstName, lastName, phone, country } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, and last name are required'
      });
    }

    // Check if email already exists
    const existingBuyer = await Buyer.findOne({ where: { email } });
    if (existingBuyer) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create buyer
    const buyer = await Buyer.create({
      id: uuidv4(),
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone: phone || null,
      country: country || null,
      isVerified: false,
      status: 'active'
    });

    // Remove password from response
    const buyerData = buyer.toJSON();
    delete buyerData.password;

    res.status(201).json({
      success: true,
      message: 'Buyer account created successfully',
      user: buyerData
    });

  } catch (error) {
    console.error('Buyer signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create buyer account'
    });
  }
}

// Buyer Login
async function buyerLogin(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find buyer by email
    const buyer = await Buyer.findOne({ where: { email } });
    if (!buyer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, buyer.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (buyer.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: buyer.id, 
        email: buyer.email, 
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        role: 'buyer' 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const buyerData = buyer.toJSON();
    delete buyerData.password;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: buyerData
    });

  } catch (error) {
    console.error('Buyer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login'
    });
  }
}

// Buyer Logout
async function buyerLogout(req, res) {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success response
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Buyer logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout'
    });
  }
}

// Seller Signup
async function sellerSignup(req, res) {
  try {
    const { email, password, firstName, lastName, phone, country, businessName } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, and last name are required'
      });
    }

    // Check if email already exists
    const existingSeller = await Seller.findOne({ where: { email } });
    if (existingSeller) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create seller
    const seller = await Seller.create({
      id: uuidv4(),
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone: phone || null,
      country: country || null,
      businessName: businessName || null,
      isVerified: false,
      status: 'pending' // Sellers need approval
    });

    // Remove password from response
    const sellerData = seller.toJSON();
    delete sellerData.password;

    res.status(201).json({
      success: true,
      message: 'Seller account created successfully. Pending approval.',
      user: sellerData
    });

  } catch (error) {
    console.error('Seller signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create seller account'
    });
  }
}

// Seller Login
async function sellerLogin(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find seller by email
    const seller = await Seller.findOne({ where: { email } });
    if (!seller) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, seller.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is approved
    if (seller.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is pending approval or inactive'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: seller.id, 
        email: seller.email, 
        firstName: seller.firstName,
        lastName: seller.lastName,
        role: 'seller' 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const sellerData = seller.toJSON();
    delete sellerData.password;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: sellerData
    });

  } catch (error) {
    console.error('Seller login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login'
    });
  }
}

// Seller Logout
async function sellerLogout(req, res) {
  try {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Seller logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout'
    });
  }
}

// Forgot Password
async function forgotPassword(req, res) {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email and role are required'
      });
    }

    // Find user by email and role
    let user;
    if (role === 'buyer') {
      user = await Buyer.findOne({ where: { email } });
    } else if (role === 'seller') {
      user = await Seller.findOne({ where: { email } });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate reset token (in production, send email)
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // In production, send email with reset link
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({
      success: true,
      message: 'Password reset instructions sent to your email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset'
    });
  }
}

// Reset Password
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    const { userId, role } = decoded;

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    if (role === 'buyer') {
      await Buyer.update(
        { password: hashedPassword },
        { where: { id: userId } }
      );
    } else if (role === 'seller') {
      await Seller.update(
        { password: hashedPassword },
        { where: { id: userId } }
      );
    }

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
}

// Verify Token
async function verifyToken(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    res.json({
      success: true,
      message: 'Token is valid',
      user: decoded
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
}

module.exports = {
  buyerSignup,
  buyerLogin,
  buyerLogout,
  sellerSignup,
  sellerLogin,
  sellerLogout,
  forgotPassword,
  resetPassword,
  verifyToken
}; 