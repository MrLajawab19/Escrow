# Backend Login Debug Report

## Validation Results

| Check | Status | Notes |
|-------|--------|------|
| .env config | ✅ | DATABASE_URL, VITE_API_URL set |
| config.json | ✅ | development creds match |
| PostgreSQL | ✅ | Running (v18) |
| DB connection | ✅ | Connects successfully |
| Database `scrowx_dev` | ✅ | Exists |
| `buyers` table | ✅ | Exists (1 test user) |
| `sellers` table | ✅ | Exists (1 test user) |
| Login API route | ✅ | `/api/auth/buyer/login`, `/api/auth/seller/login` |
| Port 3000 | ⚠️ | May be in use by another process |

---

## Root Cause

The message **"An error occurred"** on the frontend appears when `error.response` is undefined. That happens when:

1. **Backend server is not running** – connection refused
2. **Port mismatch** – frontend calls `VITE_API_URL` (e.g. 3000) but server runs on 3001/3002
3. **Vite env cache** – frontend was started before `.env` was updated

Your DB and tables are fine. The problem is usually that the frontend cannot reach the backend API.

---

## Fixes Applied

1. **server.js** – Replaced custom `loadEnv` with `require('dotenv').config()` for correct `.env` handling (quotes, special chars like `$`).

---

## Config Files (Reference)

### .env
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/scrowx_dev"
VITE_API_URL=http://localhost:3000
PORT=3000
```

**Note:** Replace `YOUR_PASSWORD` with your PostgreSQL password. If it contains `$`, `#` or spaces, keep the whole URL in quotes.

### config/config.json (development)
```json
{
  "development": {
    "username": "postgres",
    "password": "YOUR_POSTGRES_PASSWORD",
    "database": "scrowx_dev",
    "host": "127.0.0.1",
    "dialect": "postgres",
    "logging": false
  }
}
```

**Note:** `password` must match the PostgreSQL password you set during installation.

---

## Commands to Run (in order)

```powershell
# 1. Navigate to project
cd d:\ScrowX\Escrow

# 2. Validate environment
node scripts/debug-db-connection.js

# 3. Create database if it doesn't exist
node scripts/create-db.js

# 4. Create tables + test users (buyer@example.com / password)
node setup-auth-database.js

# 5. Terminal 1 – start backend (port 3000)
npm run server

# 6. Terminal 2 – start frontend (port 5173)
npm run dev
```

Then open `http://localhost:5173` and log in with:
- **Buyer:** `buyer@example.com` / `password`
- **Seller:** `seller@example.com` / `password`

---

## Quick Troubleshooting

| Symptom | Action |
|---------|--------|
| "Error occurred" on login | Ensure backend is running (`npm run server`) and frontend `VITE_API_URL` matches backend port |
| "Invalid email or password" | Wrong email/password, or run `node setup-auth-database.js` to create test users |
| "Database connection failed" | Update `config/config.json` and `.env` with your PostgreSQL password |
| Port in use | Set `PORT=3001` in `.env`, then set `VITE_API_URL=http://localhost:3001` and restart both dev server and backend |
