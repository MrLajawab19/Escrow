const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const router = express.Router();

// In-memory storage
const scopes = [];
const escrows = [];
const disputes = [];

// Helper: get multer from app
function getUpload(req) {
  return req.app.locals.upload;
}

// --- SCOPE BOX FLOW ---
// Buyer submits scope
router.post('/scope/submit', getUpload({}).single('attachment'), (req, res) => {
  const { productName, sellerName, howFound, sellerHandle, productDetails, deliveryDays, buyerName, acceptTerms } = req.body;
  if (!productName || !sellerName || !buyerName || !acceptTerms) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const scope = {
    id: uuidv4(),
    productName,
    sellerName,
    howFound,
    sellerHandle,
    productDetails,
    deliveryDays,
    buyerName,
    status: 'scope_pending',
    attachment: req.file ? `/uploads/${path.basename(req.file.path)}` : null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastActionBy: 'buyer',
    lastMessage: '',
  };
  scopes.push(scope);
  res.json(scope);
});

// Seller lists incoming scopes
router.get('/scope/list', (req, res) => {
  const { sellerName } = req.query;
  if (!sellerName) return res.status(400).json({ error: 'Missing sellerName' });
  const incoming = scopes.filter(s => s.sellerName === sellerName && s.status === 'scope_pending');
  res.json(incoming);
});

// Seller responds to scope (accept, request change, reject)
router.post('/scope/respond', (req, res) => {
  const { scopeId, action, message, newDeliveryDays } = req.body;
  const scope = scopes.find(s => s.id === scopeId);
  if (!scope) return res.status(404).json({ error: 'Scope not found' });
  if (scope.status !== 'scope_pending') return res.status(400).json({ error: 'Invalid status' });
  if (action === 'accept') {
    // Create escrow
    const escrow = {
      id: uuidv4(),
      buyer: scope.buyerName,
      seller: scope.sellerName,
      amount: null, // Buyer will set after acceptance
      status: 'pending',
      scopeId: scope.id,
      productName: scope.productName,
      productDetails: scope.productDetails,
      deliveryDays: scope.deliveryDays,
      acceptedAt: new Date(),
      autoReleaseAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    escrows.push(escrow);
    scope.status = 'accepted';
    scope.updatedAt = new Date();
    res.json({ action: 'accepted', escrow });
  } else if (action === 'request_change') {
    scope.status = 'change_requested';
    scope.updatedAt = new Date();
    scope.lastActionBy = 'seller';
    scope.lastMessage = message || '';
    if (newDeliveryDays) scope.deliveryDays = newDeliveryDays;
    res.json({ action: 'change_requested', scope });
  } else if (action === 'reject') {
    scope.status = 'rejected';
    scope.updatedAt = new Date();
    scope.lastActionBy = 'seller';
    scope.lastMessage = message || '';
    res.json({ action: 'rejected', scope });
  } else {
    res.status(400).json({ error: 'Invalid action' });
  }
});

// Buyer lists their scopes
router.get('/scope/buyer', (req, res) => {
  const { buyerName } = req.query;
  if (!buyerName) return res.status(400).json({ error: 'Missing buyerName' });
  const myScopes = scopes.filter(s => s.buyerName === buyerName);
  res.json(myScopes);
});

// Buyer edits scope if change requested
router.post('/scope/edit', getUpload({}).single('attachment'), (req, res) => {
  const { scopeId, productName, productDetails, deliveryDays } = req.body;
  const scope = scopes.find(s => s.id === scopeId);
  if (!scope) return res.status(404).json({ error: 'Scope not found' });
  if (scope.status !== 'change_requested') return res.status(400).json({ error: 'Not editable' });
  if (productName) scope.productName = productName;
  if (productDetails) scope.productDetails = productDetails;
  if (deliveryDays) scope.deliveryDays = deliveryDays;
  if (req.file) scope.attachment = `/uploads/${path.basename(req.file.path)}`;
  scope.status = 'scope_pending';
  scope.updatedAt = new Date();
  scope.lastActionBy = 'buyer';
  res.json(scope);
});

// --- ESCROW FLOW (update create route) ---
// Buyer sets amount after scope accepted
router.post('/create', (req, res) => {
  const { scopeId, amount } = req.body;
  const escrow = escrows.find(e => e.scopeId === scopeId);
  if (!escrow) return res.status(404).json({ error: 'Escrow not found' });
  if (escrow.amount) return res.status(400).json({ error: 'Amount already set' });
  escrow.amount = amount;
  escrow.updatedAt = new Date();
  res.json(escrow);
});

// Confirm payment
router.post('/confirm/:id', (req, res) => {
  const escrow = escrows.find(e => e.id === req.params.id);
  if (!escrow) return res.status(404).json({ error: 'Not found' });
  if (escrow.status !== 'pending') return res.status(400).json({ error: 'Invalid status' });
  escrow.status = 'confirmed';
  escrow.updatedAt = new Date();
  res.json(escrow);
});

// Release funds
router.post('/release/:id', (req, res) => {
  const escrow = escrows.find(e => e.id === req.params.id);
  if (!escrow) return res.status(404).json({ error: 'Not found' });
  if (escrow.status !== 'confirmed') return res.status(400).json({ error: 'Invalid status' });
  escrow.status = 'released';
  escrow.updatedAt = new Date();
  res.json(escrow);
});

// Refund buyer
router.post('/refund/:id', (req, res) => {
  const escrow = escrows.find(e => e.id === req.params.id);
  if (!escrow) return res.status(404).json({ error: 'Not found' });
  if (escrow.status !== 'confirmed') return res.status(400).json({ error: 'Invalid status' });
  escrow.status = 'refunded';
  escrow.updatedAt = new Date();
  res.json(escrow);
});

// List escrows for a user (buyer or seller)
router.get('/list', (req, res) => {
  const { role, name } = req.query;
  if (!role || !name) return res.status(400).json({ error: 'Missing role or name' });
  let filtered = [];
  if (role === 'buyer') filtered = escrows.filter(e => e.buyer === name);
  else if (role === 'seller') filtered = escrows.filter(e => e.seller === name);
  else return res.status(400).json({ error: 'Invalid role' });
  res.json(filtered);
});

// --- DISPUTE HANDLING ---
router.post('/dispute/raise', getUpload({}).single('evidence'), (req, res) => {
  const { escrowId, subject, description, atFault, raisedBy } = req.body;
  if (!escrowId || !subject || !description || !atFault || !raisedBy) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const dispute = {
    id: uuidv4(),
    escrowId,
    subject,
    description,
    atFault,
    raisedBy,
    status: 'open',
    evidence: req.file ? `/uploads/${path.basename(req.file.path)}` : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  disputes.push(dispute);
  // Mark escrow as disputed
  const escrow = escrows.find(e => e.id === escrowId);
  if (escrow) escrow.status = 'disputed';
  res.json(dispute);
});

router.get('/dispute/list', (req, res) => {
  const { user, role } = req.query;
  if (!user || !role) return res.status(400).json({ error: 'Missing user or role' });
  let filtered = [];
  if (role === 'buyer') filtered = disputes.filter(d => d.raisedBy === user || (escrows.find(e => e.id === d.escrowId)?.buyer === user));
  else if (role === 'seller') filtered = disputes.filter(d => d.raisedBy === user || (escrows.find(e => e.id === d.escrowId)?.seller === user));
  else return res.status(400).json({ error: 'Invalid role' });
  res.json(filtered);
});

// --- AUTO-RELEASE LOGIC ---
function autoReleaseEscrows() {
  const now = new Date();
  escrows.forEach(e => {
    if (e.status === 'confirmed' && e.autoReleaseAt && now > new Date(e.autoReleaseAt)) {
      e.status = 'released';
      e.updatedAt = new Date();
    }
  });
}

module.exports = router;
module.exports.autoReleaseEscrows = autoReleaseEscrows; 