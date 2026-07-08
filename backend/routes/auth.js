const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// ── Buyer routes ──────────────────────────────────────────────────────────────
router.post('/buyer/signup', authController.buyerSignup);
router.post('/buyer/login', authController.buyerLogin);

// ── Seller routes ─────────────────────────────────────────────────────────────
router.post('/seller/signup', authController.sellerSignup);
router.post('/seller/login', authController.sellerLogin);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.post('/admin/login', authController.adminLogin);

// ── Current user (token verify) ───────────────────────────────────────────────
router.get('/me', authenticateToken, authController.getCurrentUser);

// ── Avatar upload ─────────────────────────────────────────────────────────────
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), authController.uploadAvatar);

module.exports = router;