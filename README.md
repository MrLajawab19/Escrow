# ScrowX

## Project Overview
ScrowX is a modern, secure, and user-friendly escrow platform designed to facilitate trustless transactions between buyers and sellers globally. It bridges the gap between independent contractors, freelancers, and clients by providing a robust framework for managing project scopes, holding funds securely, and coordinating payment releases upon successful delivery. 

Our vision is to provide a truly universal and automated escrow experience, moving beyond generic transactions by implementing highly specialized logic for over 20+ digital and physical service categories.

## Problem Statement
In the digital economy, freelance work, remote contracting, and online transactions often suffer from mutual distrust. Buyers are hesitant to pay upfront for services they haven't received, while sellers are reluctant to commit time and resources without a guarantee of payment. Existing solutions often feature high fees, complex onboarding processes, or lack specialized tools for managing digital deliverables across diverse service categories. Furthermore, dispute resolution is often slow and heavily reliant on manual, biased human intervention.

## Solution (ScrowX)
ScrowX resolves these challenges by introducing a transparent escrow workflow that protects both parties. The platform allows buyers and sellers to agree on a predefined "Scope Box" detailing the deliverables, timeline, and cost. Funds are securely locked in escrow before work begins and are only released when the buyer is satisfied with the submitted delivery, ensuring a fair and equitable transaction process for everyone involved.

In the event of a disagreement, ScrowX utilizes an advanced AI-powered Universal Dispute Engine capable of analyzing delivery files, chat logs, and order scopes to automatically recommend fair resolutions in seconds.

## Key Features
- **Secure Escrow Payments:** Funds are held safely during the project lifecycle and released only upon delivery approval.
- **Dynamic Scope Box (20+ Categories):** Customizable project requirements tailored specifically for various industries (Content Writing, Design, Development, Video Editing, Social Media Growth, Gaming Accounts, Physical Items, etc.).
- **Automated AI Dispute Resolution:** Integrated universal rule engine and generative AI (Gemini) that detects word counts, file formats, and delivery timelines to auto-adjudicate disputes instantly.
- **Robust KYC & Identity Verification:** Integrated with Fast2SMS for OTP phone verification and secure ID uploads to ensure high-value transactions (over ₹10,000) remain compliant and secure.
- **Interactive Dashboards:** Dedicated portal views for Buyers, Sellers, and Admins to track order status, messaging, and action items.
- **Real-Time Communication:** Integrated real-time chat rooms for buyers and sellers to communicate securely within the platform.
- **Responsive UI/UX:** A modern, intuitive design optimized for desktop and mobile workflows.

## How the System Works
1. **Scope Negotiation:** The buyer or seller defines the project scope, including deliverables, conditions, deadlines, and pricing (specialized by category).
2. **KYC Verification:** Users completing high-value transactions securely verify their identity via phone OTP and document uploads.
3. **Acceptance & Funding:** Once both parties agree to the terms, the buyer funds the escrow account securely.
4. **Execution:** The seller is notified that funds are secured and begins work on the project.
5. **Delivery:** The seller submits the completed work and any necessary digital files through the platform.
6. **Review & Release:** The buyer reviews the deliverables. If satisfied, they approve the delivery, and funds are automatically released to the seller. 
7. **Dispute Handling:** If a dispute arises, the Universal Rule Engine assesses delivery evidence automatically, and the AI Dispute system generates a resolution recommendation for Admins or the parties to accept.

## Tech Stack
- **Frontend:** React, React Router, Vite, TailwindCSS, Framer Motion
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (JSON Web Tokens), bcryptjs
- **AI & External APIs:** Google Generative AI (Gemini), Fast2SMS (OTP generation)
- **File Management:** Multer (for handling digital deliveries, KYC documents, and dispute evidence)

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
GEMINI_API_KEY=your_gemini_api_key
FAST2SMS_API_KEY=your_fast2sms_api_key
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
- Implementation of multi-currency support and advanced payment gateways (Razorpay integration upcoming).
- Upgraded Admin Dashboard with detailed analytics, financial reporting, and comprehensive KYC queues.
- Mobile application development for iOS and Android platforms.
