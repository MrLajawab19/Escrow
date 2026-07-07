# ScrowX — Trust Infrastructure for Informal Micro-Transactions

## Project Overview
ScrowX is a modern, secure trust infrastructure platform for informal transactions of any size, specifically targeting the massive volume of freelance work and peer-to-peer sales under $50 (₹5,000). It operates as a digital notary, evidence recorder, and AI arbitration engine. 

ScrowX acts as a **fund-locking trust layer**. It securely locks funds in escrow (powered by Razorpay) and releases them based on a digitally signed deed, evidence submission, and AI-powered arbitration—removing leverage from either party while keeping the process fast and informal.

## Problem Statement
Informal transactions often suffer from:
- **Zero paper trail**: No formal documentation of what was agreed.
- **No recourse**: Too small to pursue in court, leaving parties vulnerable to fraud.
- **Platform lock-in**: Freelance platforms only protect users who stay within their walled gardens.
- **Asymmetric power**: No neutral third party for fast, low-cost dispute resolution.

## Solution (ScrowX)
ScrowX solves these challenges by introducing an immutable, cryptographically sealed workflow:
1. Buyer locks funds with ScrowX.
2. Both parties sign a digital **Deed**.
3. ScrowX notifies the seller that funds are secured.
4. The seller delivers the work.
5. The buyer confirms delivery or raises a dispute within 7 days.
6. In case of a dispute, the **AI Arbitration Engine** renders a verdict in under 48 hours.

Funds are released exactly per the outcome—all backed by a full, immutable audit ledger preserved forever.

## Key Features
- **Secure Fund Locking:** Funds are held safely during the project lifecycle via Razorpay and released only upon delivery approval or arbitration verdict.
- **Digital Deeds & Milestones:** Legally structured digital agreements detailing scope, deadlines, and acceptance criteria. Supports milestone-based payments with auto-release options.
- **Immutable Audit Ledger:** Every action is recorded as a chained, hashed entry, providing a tamper-evident history of the transaction.
- **Formal Notice System:** Replaces unstructured chat with legally-weighted, structured communication records (e.g., Progress Requests, Revision Requests) with enforced deadlines.
- **AI Arbitration Engine:** Resolves disputes in under 48 hours using GPT-4o. Analyzes the deed, submitted evidence, and behavioral risk scores. Includes percentage-based dispute fees and human escalation options.
- **Behavioral Risk & Fraud Detection:** Maintains a Behavioral Risk Score (BRS) for every user to deter bad actors, and automatically runs fraud possibility assessments (e.g., image originality, metadata checks) during disputes.
- **One-Time KYC:** Secure, one-time phone and identity verification required before engaging in transactions.

## How the System Works
1. **Deed Creation:** The buyer or seller defines the project scope, acceptance criteria, and amount (supports milestones).
2. **KYC & Identity:** Both parties must have completed their one-time KYC verification.
3. **Acceptance & Funding:** Both parties digitally sign the Deed via OTP. The buyer funds the escrow account securely.
4. **Execution & Notices:** The seller begins work. Any communication happens via Formal Notices.
5. **Delivery:** The seller submits deliverables (files, links) with cryptographic hashes recorded in the ledger.
6. **Review & Release:** The buyer has 7 days to review. If satisfied, they approve, and funds are released.
7. **Dispute Handling:** If a dispute arises, both parties submit evidence. The AI Arbitration Engine provides a fair verdict within 48 hours, automatically executing the fund release or refund.

## Tech Stack
- **Frontend:** React, React Router, Vite, TailwindCSS, Framer Motion
- **Backend:** Node.js, Express.js, Socket.io
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Custom JWT (migrating to Clerk)
- **AI & File Analysis:** OpenAI API (GPT-4o), Tesseract.js, Sharp, imghash
- **Payments:** Razorpay Integration

## Installation and Setup Instructions

### Prerequisites
- Node.js (v20 or higher recommended)
- PostgreSQL database

### 1. Clone the Repository
```bash
git clone <repository_url>
cd Escrow
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory and add the necessary variables:
```env
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/scrowx
JWT_SECRET=your_secure_jwt_secret
OPENAI_API_KEY=your_openai_api_key
FAST2SMS_API_KEY=your_fast2sms_api_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### 4. Database Setup
Sync your database using Prisma:
```bash
npx prisma db push
```

### 5. Start the Application
To run the backend and frontend systems locally:
```bash
# Start the backend server
node server.js

# In a separate terminal, start the frontend development server
npm run dev
```

## Project Structure
```text
Escrow/
├── backend/                  # Backend application code
│   ├── config/               # Database and environment configurations
│   ├── controllers/          # Request handlers and business logic
│   ├── middleware/           # Express middleware (auth, KYC gates, etc.)
│   ├── routes/               # API route definitions
│   └── services/             # Core service implementations (AI, KYC, Email, SMS)
├── prisma/                   # Prisma schema and migrations
├── src/                      # Frontend React application
│   ├── components/           # Reusable UI components and modals
│   ├── pages/                # High-level page components
│   └── index.css             # Tailwind styling entry
├── package.json              # Project dependencies and scripts
└── server.js                 # Main Express application entry point
```

## Future Roadmap
- Integration with Clerk for production-grade authentication.
- Cloudinary/S3 integration for scalable file storage.
- Admin dashboard upgrades for manual dispute escalation queues and arbitration prompt engineering.
- API access for third-party platforms to integrate ScrowX as their native trust layer.
