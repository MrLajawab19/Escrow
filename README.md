# ScrowX — Trust Infrastructure for Informal Micro-Transactions

A full-stack escrow platform for freelance and peer-to-peer service agreements.
Locks funds, enforces digital agreements (Deeds), and resolves disputes with AI arbitration.

---

## Key Features

- **Deed-Based Lifecycle** — Every transaction is anchored to a digitally-signed `Deed` (the
  sole source of truth). Funds cannot move without deed state transitions.
- **AI-Driven Dispute Resolution** — Disputes are analyzed by Google Gemini AI using submitted
  evidence, behavioral risk scores, and deed metadata. Includes challenge rounds and automatic
  escalation to human review for high-value or low-confidence cases.
- **Wallet & Ledger System** — Append-only ledger; balance is always derived from
  `WalletTransaction` sums (never a mutable field). Atomic DB guards prevent double-spend and
  race conditions.
- **Real-Time Chat** — Socket.IO chat between deed participants throughout the deed lifecycle.
- **AI Support Chat** — Live customer support chat powered by xAI Grok (with OpenAI fallback).
- **Formal Notice System** — Structured, legally-weighted communication records (Progress
  Requests, Revision Requests) with enforced deadlines.
- **Immutable Audit Ledger** — Every wallet and deed action is chained and recorded;
  tamper-evident history is preserved permanently.
- **Behavioral Risk Score (BRS)** — Per-user risk scoring deters bad actors and informs
  arbitration.
- **One-Time KYC** — Phone and identity verification required before transacting.
- **Admin Dashboard** — Dispute management, financial oversight, and user administration.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, React Router v7, Vite 7, TailwindCSS, Framer Motion, Lucide React |
| **Backend** | Node.js, Express.js, Socket.IO |
| **Database** | PostgreSQL with Prisma ORM (v5.10) |
| **Authentication** | Custom JWT (`jsonwebtoken`, `bcryptjs`) |
| **AI — Dispute Resolution** | Google Gemini (`@google/genai`, `GEMINI_API_KEY`) |
| **AI — Support Chat** | xAI Grok (`GROK_API_KEY`); OpenAI GPT as fallback |
| **Payments** | Razorpay (INR; wallet top-up and escrow lock/release) |
| **Email** | Resend |
| **File Analysis** | Tesseract.js, Sharp, imghash, file-type |
| **Deployment** | Render (backend) + Netlify (frontend) |

---

## Prerequisites

- **Node.js** v20.x (pinned in `engines` field of `package.json`)
- **PostgreSQL** database (local or hosted — Railway, Supabase, Neon, etc.)
- A **Razorpay** account (Key ID + Key Secret)
- A **Google AI Studio** API key for Gemini dispute resolution
- An **xAI** API key for Grok (support chat — optional for basic local dev)
- A **Resend** API key (email notifications)

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone <repository_url>
cd Escrow
```

### 2. Install dependencies

```bash
npm install
```

> `postinstall` automatically runs `prisma generate` — no separate step needed.

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env   # Linux/macOS
copy .env.example .env # Windows
```

Required variables:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/scrowx_dev"
PROD_DATABASE_URL="postgresql://USER:PASSWORD@host:PORT/dbname"

# Frontend (Vite)
VITE_API_URL=http://localhost:3000

# AI — Dispute resolution (Google Gemini)
# Generate at: https://aistudio.google.com
GEMINI_API_KEY="your-gemini-api-key"

# AI — Support chat (xAI Grok)
# Generate at: https://console.x.ai
GROK_API_KEY="xai-your-api-key-here"

# Auth — use a long random string (min 32 chars)
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET="your-random-secret-here"

# Payments
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="your-razorpay-secret"

# Email
RESEND_API_KEY="re_..."
```

> ⚠️ **Never commit `.env`** — it is listed in `.gitignore`.

### 4. Push the database schema

```bash
npx prisma db push
```

> Use `db push` (not `migrate deploy`) for development. Re-run this whenever
> `prisma/schema.prisma` changes.

### 5. (Optional) Seed the admin user

```bash
node backend/scripts/seedAdmin.js
```

### 6. Run the application locally

```bash
# Terminal 1 — Backend (Express + Socket.IO), defaults to port 3000
node server.js

# Terminal 2 — Frontend (Vite dev server), defaults to port 5173
npm run dev
```

The app is then accessible at `http://localhost:5173`, with the API at `http://localhost:3000`.

> **Note on Razorpay webhooks:** Webhooks cannot reach `localhost` in local dev — that is
> expected. The `/api/deeds/:id/verify-payment` endpoint is the synchronous payment
> confirmation path used during local development.

---

## Available Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start Vite frontend dev server (port 5173) |
| `npm run server` | Start backend with `node server.js` (port 3000) |
| `npm start` | `prisma db push` then `node server.js` — used in deployment |
| `npm run Frontend-build` | Build frontend for production (`vite build`) |
| `npm run lint` | Run ESLint |

---

## Project Structure

```text
Escrow/
├── backend/
│   ├── config/          # DB and environment configuration
│   ├── controllers/     # Route handlers and business logic
│   ├── jobs/            # Scheduled/cron jobs (e.g. chat expiry)
│   ├── middleware/       # Auth, KYC gates, rate limiting
│   ├── routes/          # Express route definitions
│   ├── scripts/         # Permanent utility scripts (e.g. seedAdmin.js)
│   ├── services/        # Core services: Gemini AI, Grok, wallet, email, KYC
│   ├── socket/          # Socket.IO chat handlers
│   ├── tests/           # Backend regression test suite
│   └── utils/           # Shared utilities
├── prisma/
│   └── schema.prisma    # Database schema (source of truth)
├── src/                 # React frontend
│   ├── components/      # Reusable UI components
│   ├── config/          # Axios instance and API configuration
│   ├── context/         # React context (auth, etc.)
│   ├── lib/             # Frontend utilities
│   └── pages/           # Page-level components
├── tests/               # Root-level regression test suite
│   ├── test-phase1.js   # Fee engine regression (Phase 1)
│   ├── test-phase2.js   # Fee engine regression (Phase 2)
│   ├── test-phase3.js   # Fee engine regression (Phase 3)
│   ├── test-idempotency.js  # TOCTOU / double-payment regression
│   └── test-concurrency.js  # Concurrency harness
├── .env.example         # Environment variable template (copy to .env)
├── index.html           # Vite HTML entry point
├── server.js            # Express + Socket.IO application entry point
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies and scripts
```

---

## Deployment

- **Backend:** [Render](https://render.com) — set all environment variables in the Render
  dashboard. The `npm start` script (`prisma db push && node server.js`) runs automatically
  on deploy.
- **Frontend:** [Netlify](https://netlify.com) — `netlify.toml` is pre-configured. Set
  `VITE_API_URL` to your Render backend URL as a Netlify environment variable before building.
