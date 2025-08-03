const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const escrowRoutes = require('./routes/escrow');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const disputeRoutes = require('./routes/disputes');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for React frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));
app.use('/escrow', escrowRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/disputes', disputeRoutes);

// Cron-like job for auto-release
const escrowModule = require('./routes/escrow');
setInterval(() => {
  if (escrowModule.autoReleaseEscrows) {
    escrowModule.autoReleaseEscrows();
  }
}, 60 * 60 * 1000); // every hour

app.listen(PORT, () => {
  console.log(`EscrowX server running on http://localhost:${PORT}`);
}); 