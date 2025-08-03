const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const disputeController = require('../controllers/disputeController');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'evidence-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    // Check mimetype more flexibly
    const allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/txt',
      'application/octet-stream' // Allow unknown types
    ];
    
    const isValidMimeType = allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('text/');
    
    if (extname && (isValidMimeType || file.mimetype === 'application/octet-stream')) {
      return cb(null, true);
    } else {
      cb(new Error('Only image, PDF, and document files are allowed'));
    }
  }
});

// User routes (require authentication)
router.use(authenticateToken);

// Create dispute
router.post('/', upload.array('evidence', 5), disputeController.createDispute);

// Get disputes by user
router.get('/user/my-disputes', disputeController.getDisputesByUser);

// Get dispute by ID (user can view their own disputes)
router.get('/:id', disputeController.getDisputeById);

// Add evidence to dispute
router.post('/:id/evidence', upload.array('evidence', 5), disputeController.addEvidence);

// Admin routes (require admin authentication)
router.use(authenticateAdmin);

// Get all disputes (admin only)
router.get('/', disputeController.getAllDisputes);

// Update dispute status (admin only)
router.patch('/:id/status', disputeController.updateDisputeStatus);

// Resolve dispute (admin only)
router.patch('/:id/resolve', disputeController.resolveDispute);

// Get dispute statistics (admin only)
router.get('/stats/overview', disputeController.getDisputeStats);

module.exports = router; 