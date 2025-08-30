const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const escrowRoutes = require('./routes/escrow');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const disputeRoutes = require('./routes/disputes');
const supportChatRoutes = require('./routes/supportChat');
const fs = require('fs');

// Load environment variables manually if dotenv is not available
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      });
    }
  } catch (error) {
    console.log('Note: Could not load .env file, using defaults');
  }
}

loadEnv();

const app = express();
let PORT = Number(process.env.PORT) || 3000;

// Enable CORS for React frontend
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    'https://scrowx.netlify.app',
    process.env.FRONTEND_URL || 'https://scrowx.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
app.use('/api/support-chat', supportChatRoutes);

// Cron-like job for auto-release
const escrowModule = require('./routes/escrow');
setInterval(() => {
  if (escrowModule.autoReleaseEscrows) {
    escrowModule.autoReleaseEscrows();
  }
}, 60 * 60 * 1000); // every hour

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

function startServer(port, attemptsLeft = 3) {
  const server = app
    .listen(port, () => {
      console.log(`ScrowX server running on http://localhost:${port}`);
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