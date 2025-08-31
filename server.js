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

// Load environment variables based on NODE_ENV
function loadEnv() {
  try {
    const nodeEnv = process.env.NODE_ENV || 'development';
    let envPath;
    
    if (nodeEnv === 'production') {
      envPath = path.join(__dirname, '.env.production');
    } else {
      envPath = path.join(__dirname, '.env.local');
    }
    
    // Fallback to .env if specific env file doesn't exist
    if (!fs.existsSync(envPath)) {
      envPath = path.join(__dirname, '.env');
    }
    
    if (fs.existsSync(envPath)) {
      console.log(`Loading environment from: ${path.basename(envPath)}`);
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
          process.env[key.trim()] = value.trim();
        }
      });
    }
  } catch (error) {
    console.log('Note: Could not load environment file, using defaults');
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
  // Only update .env.local for development
  if (process.env.NODE_ENV !== 'production') {
    const envPath = path.join(__dirname, '.env.local');
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