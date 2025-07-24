const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const escrowRoutes = require('./routes/escrow');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/escrow', escrowRoutes);

app.listen(PORT, () => {
  console.log(`EscrowX server running on http://localhost:${PORT}`);
}); 