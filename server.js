require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const express = require('express');
const http = require('http');                                   // ← NEW: needed for Socket.IO
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const { Server } = require('socket.io');                        // ← NEW: Socket.IO server
const escrowRoutes = require('./backend/routes/escrow');
const orderRoutes = require('./backend/routes/orders');
const authRoutes = require('./backend/routes/auth');
const disputeRoutes = require('./backend/routes/disputes');
const supportChatRoutes = require('./backend/routes/supportChat');
const chatRoutes = require('./backend/routes/chat');            // ← NEW: order chat REST
const adminRoutes = require('./backend/routes/admin');          // ← NEW: admin API
const { registerChatSocket } = require('./backend/socket/chatSocket'); // ← NEW: socket handler
const { startChatExpiryCron } = require('./backend/jobs/chatExpiry'); // ← NEW: expiry cron
const fs = require('fs');

const app = express();

// ── Create HTTP server (wraps express — required for Socket.IO) ───────────────
// All existing middleware, routes, and port logic below are UNCHANGED.
const httpServer = http.createServer(app);                      // ← NEW

// ── Socket.IO — attach to the same HTTP server ────────────────────────────────
const io = new Server(httpServer, {                             // ← NEW
  cors: {
    origin: [
      'http://localhost:5173',
      'https://scrowx.netlify.app',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  },
});
registerChatSocket(io);                                         // ← NEW: register all chat events

let PORT = Number(process.env.PORT) || 3000;

// ── CORS (unchanged) ──────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://scrowx.netlify.app",
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

// ── Uploads directory (unchanged) ────────────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));

// ── Routes (all originals unchanged + new chat route) ────────────────────────
app.use('/escrow', escrowRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/support-chat', supportChatRoutes);
app.use('/api/chat', chatRoutes);                               // ← NEW: order chat REST
app.use('/api/admin', adminRoutes);                            // ← NEW: admin API

// ── Existing auto-release cron (unchanged) ────────────────────────────────────
const escrowModule = require('./backend/routes/escrow');
setInterval(() => {
  if (escrowModule.autoReleaseEscrows) {
    escrowModule.autoReleaseEscrows();
  }
}, 60 * 60 * 1000);

// ── Chat expiry cron (new) ────────────────────────────────────────────────────
startChatExpiryCron();                                          // ← NEW

// ── .env port updater (unchanged) ────────────────────────────────────────────
function updateEnvFile(port) {
  const envPath = path.join(__dirname, '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  const newApiUrl = `VITE_API_URL=http://localhost:${port}`;

  if (envContent.includes('VITE_API_URL=')) {
    envContent = envContent.replace(/VITE_API_URL=.*/g, newApiUrl);
  } else {
    envContent += `\n${newApiUrl}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log(`Updated VITE_API_URL to http://localhost:${port}`);
}

// ── Server start with port fallback (unchanged logic, httpServer instead of app) ──
function startServer(port, attemptsLeft = 3) {
  const server = httpServer                                     // ← was: app.listen(...)
    .listen(port, () => {
      console.log(`ScrowX server running on http://localhost:${port}`);
      console.log(`Socket.IO attached on ws://localhost:${port}`);
      updateEnvFile(port);
    })
    .on('error', (err) => {
      if (err && err.code === 'EADDRINUSE' && attemptsLeft > 0) {
        const nextPort = port + 1;
        console.warn(`Port ${port} in use, retrying on ${nextPort}...`);
        startServer(nextPort, attemptsLeft - 1);
      } else {
        console.error('Failed to start server:', err);
        process.exit(1);
      }
    });
  return server;
}

startServer(PORT);