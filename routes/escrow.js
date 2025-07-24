const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// In-memory escrow storage
const escrows = [];

// Create escrow
router.post('/create', (req, res) => {
  const { buyer, seller, amount } = req.body;
  if (!buyer || !seller || !amount) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const escrow = {
    id: uuidv4(),
    buyer,
    seller,
    amount,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  escrows.push(escrow);
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

module.exports = router; 