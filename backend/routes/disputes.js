const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const disputeController = require('../controllers/disputeController');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'evidence-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/txt',
      'application/octet-stream'
    ];
    const isValidMime = allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('text/');
    if (extname && (isValidMime || file.mimetype === 'application/octet-stream')) {
      return cb(null, true);
    }
    cb(new Error('Only image, PDF, text, and document files are allowed'));
  }
});

// All routes require authentication
router.use(authenticateToken);

// ── IMPORTANT: Static routes MUST come before dynamic /:id routes ─────────────

// Get all disputes for authenticated user
router.get('/user/my-disputes', disputeController.getDisputesByUser);

// Get dispute stats (static route - must be before /:id)
router.get('/stats/overview', disputeController.getDisputeStats);

// Get all disputes (admin)
router.get('/', disputeController.getAllDisputes);

// Create dispute (triggers rule engine + AI automatically)
router.post('/', upload.array('evidence', 5), disputeController.createDispute);

// ── Dynamic routes (/:id) ─────────────────────────────────────────────────────

// Get full dispute detail (includes ruleFlags, aiAnalysis, evidenceResponses)
router.get('/:id/full', disputeController.getFullDisputeDetail);

// Get dispute by ID
router.get('/:id', disputeController.getDisputeById);

// Add evidence (legacy - file upload only)
router.post('/:id/evidence', upload.array('evidence', 5), disputeController.addEvidence);

// Submit counter-evidence (text + optional files)
router.post('/:id/submit-evidence', upload.array('files', 5), disputeController.submitEvidence);

// Smart escalate to human moderator
router.post('/:id/smart-escalate', disputeController.smartEscalate);

// Trigger / re-trigger AI analysis
router.post('/:id/ai-analysis', disputeController.triggerAIAnalysis);

// Update dispute status
router.patch('/:id/status', disputeController.updateDisputeStatus);

// Resolve dispute
router.patch('/:id/resolve', disputeController.resolveDispute);

module.exports = router;