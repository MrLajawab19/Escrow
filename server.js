require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const express = require('express');
const helmet = require('helmet');
const http = require('http');                                   // ← NEW: needed for Socket.IO
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const { Server } = require('socket.io');                        // ← NEW: Socket.IO server
const orderRoutes = require('./backend/routes/orders');
const authRoutes = require('./backend/routes/auth');
const disputeRoutes = require('./backend/routes/disputes');
const supportChatRoutes = require('./backend/routes/supportChat');
const chatRoutes = require('./backend/routes/chat');            // ← NEW: order chat REST
const adminRoutes = require('./backend/routes/admin');          // ← NEW: admin API
const walletRoutes = require('./backend/routes/wallet');        // ← NEW: wallet routes
const deedsRoutes = require('./backend/routes/deeds');
const kycRoutes = require('./backend/routes/kyc');
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

// ── Security Headers (helmet) ─────────────────────────────────────────────────
// Applied early, before any routes. CSP is configured to allow:
//  - Razorpay Checkout script + iframe
//  - Google Fonts (fonts.googleapis.com + fonts.gstatic.com)
//  - Inline scripts (theme-flash prevention in index.html)
//  - Vite dev server HMR websocket (dev only)
app.use(helmet({
  // CSP: the most impactful header — misconfigured CSP silently breaks Razorpay/fonts
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",           // needed for index.html theme-flash script + Vite HMR
        "https://checkout.razorpay.com",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",           // Tailwind + Razorpay inject inline styles
        "https://fonts.googleapis.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://*.razorpay.com",
      ],
      connectSrc: [
        "'self'",
        "https://*.razorpay.com",    // Razorpay API calls from checkout widget
        "ws://localhost:*",          // Vite HMR in dev (harmless in prod — no ws server)
        "wss://localhost:*",
      ],
      frameSrc: [
        "'self'",
        "https://*.razorpay.com",    // Razorpay Checkout opens in an iframe
        "https://api.razorpay.com",
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  // Razorpay checkout loads cross-origin resources inside its iframe;
  // COEP would block them, so we disable it.
  crossOriginEmbedderPolicy: false,
}));

// ── Uploads directory (unchanged) ────────────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));

// ── Global API rate limiter ──────────────────────────────────────────────────
// 100 requests per 15 min per IP — baseline ceiling for all API traffic.
// The Razorpay webhook is exempt (handled via skip() inside the limiter).
const { globalLimiter } = require('./backend/middleware/rateLimiter');
app.use('/api', globalLimiter);

// ── Routes (all originals unchanged + new chat route) ────────────────────────
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/support-chat', supportChatRoutes);
app.use('/api/chat', chatRoutes);                               // ← NEW: order chat REST
app.use('/api/admin', adminRoutes);                            // ← NEW: admin API
app.use('/api/wallet', walletRoutes);                          // ← NEW: wallet routes
app.use('/api/deeds', deedsRoutes);
app.use('/api/kyc', kycRoutes);
const notificationsRoutes = require('./backend/routes/notifications');
app.use('/api/notifications', notificationsRoutes);
const profilesRoutes = require('./backend/routes/profiles');
app.use('/api/profiles', profilesRoutes);

// ── Auto-release cron (checks orders hourly, releases approved ones) ───────────
setInterval(async () => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    // Auto-release orders that have been in APPROVED status for over 72 hours
    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const toRelease = await prisma.order.findMany({
      where: { status: 'APPROVED', updatedAt: { lte: cutoff } },
    });
    for (const order of toRelease) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'COMPLETED',
          orderLogs: [...(Array.isArray(order.orderLogs) ? order.orderLogs : []), {
            event: 'AUTO_RELEASED',
            byUserId: 'system',
            timestamp: new Date().toISOString(),
            description: 'Auto-released after 72h in APPROVED status',
          }],
        },
      });
      console.log(`[AutoRelease] Order ${order.id} auto-completed.`);
    }
  } catch (e) {
    console.error('[AutoRelease] Error:', e.message);
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