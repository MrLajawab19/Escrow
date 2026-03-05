# ScrowX

## Project Overview
ScrowX is a modern, secure, and user-friendly escrow platform designed to facilitate trustless transactions between buyers and sellers globally. It bridges the gap between independent contractors, freelancers, and clients by providing a robust framework for managing project scopes, holding funds securely, and coordinating payment releases upon successful delivery.

## Problem Statement
In the digital economy, freelance work, remote contracting, and online transactions often suffer from mutual distrust. Buyers are hesitant to pay upfront for services they haven't received, while sellers are reluctant to commit time and resources without a guarantee of payment. Existing solutions often feature high fees, complex onboarding processes, or lack specialized tools for managing digital deliverables across diverse service categories.

## Solution (ScrowX)
ScrowX resolves these challenges by introducing a transparent escrow workflow that protects both parties. The platform allows buyers and sellers to agree on a predefined "Scope Box" detailing the deliverables, timeline, and cost. Funds are securely locked in escrow before work begins and are only released when the buyer is satisfied with the submitted delivery, ensuring a fair and equitable transaction process for everyone involved.

## Key Features
- **Secure Escrow Payments:** Funds are held safely during the project lifecycle and released only upon delivery approval.
- **Dynamic Scope Box:** Customizable project requirements tailored specifically for various industries (design, development, social media, etc.).
- **Interactive Dashboards:** Dedicated portal views for Buyers and Sellers to track order status, messaging, and action items.
- **Dispute Resolution System:** Integrated tools allowing users to raise and mediate disputes with administrative oversight.
- **Automated Reversion Tools:** Scripts included for seamless testing and resetting of state during development and QA.
- **Responsive UI/UX:** A modern, intuitive design optimized for desktop and mobile workflows.

## How the System Works
1. **Scope Negotiation:** The buyer or seller defines the project scope, including deliverables, conditions, deadlines, and pricing.
2. **Acceptance & Funding:** Once both parties agree to the terms, the buyer funds the escrow account securely.
3. **Execution:** The seller is notified that funds are secured and begins work on the project.
4. **Delivery:** The seller submits the completed work and any necessary digital files through the platform.
5. **Review & Release:** The buyer reviews the deliverables. If satisfied, they approve the delivery, and funds are automatically released to the seller. Alternatively, they can request changes or raise a dispute.

## Tech Stack
- **Frontend:** React, React Router, Vite, TailwindCSS, Framer Motion
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL with Sequelize ORM
- **Authentication:** JWT (JSON Web Tokens), bcryptjs
- **File Management:** Multer (for handling digital deliveries and dispute evidence)

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
JWT_SECRET=your_secure_jwt_secret
DATABASE_URL=postgres://user:password@localhost:5432/scrowx
FRONTEND_URL=http://localhost:5173
```
*Note: Ensure your `backend/config/config.json` is updated to match your local database credentials.*

### 4. Database Setup
Run the included setup scripts to initialize the database and create test users:
```bash
node setup-auth-database.js
node setup-database.js
```

### 5. Start the Application
To run the backend and frontend systems locally:
```bash
# Start the backend server
npm run start

# In a separate terminal, start the frontend development server
npm run dev
```

### 6. Development Testing
To populate the database with mock orders for testing the UI:
```bash
npm run revert-mock-orders
```

## Project Structure
```text
Escrow/
├── backend/                  # Backend application code
│   ├── config/               # Database and environment configurations
│   ├── controllers/          # Request handlers and business logic
│   ├── middleware/           # Express middleware (auth, etc.)
│   ├── models/               # Sequelize database models
│   ├── routes/               # API route definitions
│   └── services/             # Core service implementations
├── public/                   # Static assets
├── src/                      # Frontend React application
│   ├── components/           # Reusable UI components
│   ├── pages/                # High-level page components
│   └── index.css             # Tailwind styling entry
├── package.json              # Project dependencies and scripts
└── server.js                 # Main Express application entry point
```

## Future Roadmap
- Implementation of multi-currency support and advanced payment gateways.
- Integration of real-time WebSocket communication for order messaging.
- Upgraded Admin Dashboard with detailed analytics and financial reporting.
- Expansion of automated dispute mediation using rule-based metrics.
- Mobile application development for iOS and Android platforms.
