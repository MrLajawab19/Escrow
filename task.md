# ScrowX — Comprehensive Task & History Tracker

## How to use this file
- Canonical checklist for all work on ScrowX, in chronological order.
- Mark items `[/]` when starting, `[x]` when done, `[ ]` when not started.
- Add new tickets at the bottom. **Never delete completed tickets — they are permanent record.**
- Last updated: 2026-07-21

---

## Pre-Antigravity MVP (March 2026)
> Initial Sequelize→Prisma port, basic escrow flow. Commits `cdcf97d`–`8d3c960`.

- [x] Basic escrow order flow (buyer/seller dashboards, scope box, dispute box)
- [x] Seller Dashboard with scope request management and order fulfillment
- [x] ScopeBox preview and niche-specific scope types (logo, content writing, etc.)
- [x] Dispute system (basic modal, auto-release stub)
- [x] Deploy to Railway (backend) + Netlify (frontend)
- [x] `.env` security: remove from git, add `.gitignore` and `.env.example`

---

## Phase 1 — Foundation Hardening
> Commits `2e75cdf`, `d4a6140`. Sessions: `fcace840`.

- [x] 1.1 — JWT Standardization & Backend Fixes
- [x] 1.2 — Frontend API Integration Fix
- [x] 1.3 — Error Handling, Loading States & 404

## Phase 2 — Unified Deed → Order Bridge
> Commits `6f4fc08`, `22097de`, `57508ec`.

- [x] 2.1 — Backend: Deed → Order Bridge (Deed model created, Order used as bridge)
- [x] 2.2 — Deed Creation Frontend (`NewDeedPage.jsx` initial version)
- [x] 2.3 — Seller Deed Acceptance & Funding Flow

## Phase 3 — KYC & Identity Verification
> Commits `a017549`, `f3daa46`, `b3b0c83`.

- [x] 3.1 — OTP Backend (Fast2SMS integration)
- [x] 3.2 — ID Upload & KYC Gating (middleware)
- [x] 3.3 — KYC Frontend

## Phase 4 — Dispute Engine & AI (Initial)
> Commit `6e87643`.

- [x] 4.1 — Universal Rule Engine (category-based, scopeBox-driven)
- [x] 4.2 — Universal Dispute AI (Gemini integration)
- [x] 4.3 — Dispute Frontend Polish (new dispute modal)

## Phase 5 — Initial Razorpay Integration
> Commit `3184e0e`.

- [x] End-to-end wallet functionality with Razorpay

## Phase 6 — Notifications & Emails
> Commit `07e7842`.

- [x] Notification backend
- [x] Resend email service
- [x] In-app notification UI

## Phase 7 — User Profiles & Ratings
> Commits `8d5133a`, `870ab13`, `f14500a`.

- [x] 7.1 — Review System Backend
- [x] 7.2 — Seller Profile Frontend
- [x] 7.3 — Buyer Profile & Profile Images

## Phase 8 — Deed Milestone Tracker & Audit Ledger
> Commit `851cfb0`.

- [x] 8.1 — Milestone Tracker Frontend
- [x] 8.2 — Deed Signing & Content Hash (SHA-256 hash chain via AuditLedger)
- [x] 8.3 — Audit Ledger Viewer

## Phase 9 — Admin Panel (Initial)
> Commits `3ec9f2d`, `5f09702`.

- [x] 9.1 — Admin KYC & User Management
- [x] 9.2 — Admin Dashboard Functionalities

---

## Wallet Hardening — Subphase A–F

### Subphase A — Initial Razorpay Top-Up Hardening
> Commit `eccb47c`.
- [x] Server-side double payment prevention for top-ups

### Subphase A Fix — Atomic Row-Level Lock
> Commit `ab43e6c`.
- [x] Make top-up double payment prevention atomic using row-level lock

### Subphase B Fix — Graceful Concurrent Polling
> Commit `2891648`.
- [x] Graceful polling for concurrent Razorpay orders; add cron job flag

### Subphase E — Float → Int (Paise) Migration
> Commit `d94d1362-session`. Commit `bf71047` (Render deploy fix).
- [x] Update `schema.prisma` Float → Int (all monetary fields now in paise/subunits)
- [x] Run `npx prisma db push --accept-data-loss` (Float→Int cast)
- [x] Update `validationUtils.js` upper bound
- [x] Update `walletService.js` fee calculations (`Math.floor`)
- [x] Update `deedService.js` (`parseInt`, `Math.floor`)
- [x] Update `paymentController.js` (remove `/100` division)
- [x] Update test scripts for paise amounts

### Subphase F — Ledger-Derived `lockedBalance` Reconciliation
> Commit `41f23cf`.
- [x] `lockedBalance` derived from ledger (deed amounts), not mutable wallet field

---

## Phase 5 — Payment Gateway Full Rewrite (JIT/Webhook Architecture)
> Commits `797a06c`–`3cc98cc`. Session: `d94d1362`-adjacent.

- [x] Phase 5 Step 1: `WebhookEvent` schema; rate limiter; critical route auth fix
- [x] Phase 5 Step 2: `paymentService.js` and JIT webhook rewrite with idempotency
- [x] Phase 5 Step 2 Fix: Payout webhooks, stuck-PROCESSING crash recovery, auto-seeding tests
- [x] Phase 5 Step 2.5: Harden withdrawal flows and idempotency race conditions
- [x] Phase 5 Step 2.6: Remove legacy `processTransaction` and `updateWalletBalance` recalculation
- [x] Phase 5 Security: Purge dead legacy mutation endpoints (`cancelOrder`, `rejectOrder`, `refundBuyer`)
- [x] Phase 5 Security: Disable legacy refund route in `orders.js`
- [x] Phase 5 Security: Auth guards, `walletLimiter` on reject
- [x] Phase 5 Step 3: Real Razorpay top-up flow; disable direct fund routes
- [x] Phase 5 Step 3 Fix: Unit mismatch bug; standardise on paise for top-ups
- [x] Phase 5 Step 4: Tune `walletLimiter` max to 20; use `req.user.id` explicitly
- [x] Phase 5 Final: E2E uses webhooks; payout stubs blocked with warnings
- [x] Phase 5 Final: Wire `TopUpModal` to real Razorpay Checkout.js + async polling message
- [x] `getWalletSummary` fixed for sellers; architecture note on ledger limits (`9183f40`)

## Phase 10 — Security & Performance
> Commits `f976238`, `7c1720a`, `3a400e1`.

- [x] 10.1 — Helmet, rate limiting, and input validation middleware
- [x] 10.2 — Admin queue pagination + N+1 query fixes
- [x] 10.3 — react-helmet-async SEO tags + route-level lazy loading

---

## UI/UX Sessions

### Landing Page Redesign
> Session `d155ec8e`. Commits in `21a5b04`-adjacent work.
- [x] Audit and remove global CSS conflicts (`index.css` / `App.css`)
- [x] Create `LandingNavbar.jsx`, `HeroEmbedded.jsx`, `TrustStrip.jsx`
- [x] Create `InteractiveTimeline.jsx`, `ScopeBoxPreview.jsx`, `DisputeComparison.jsx`, `FinalCTA.jsx`
- [x] Refactor `LandingPage.jsx` to wrap new components

### Dark Mode
> Session `c85e8022`. Commit `b43fa70`.
- [x] `ThemeContext` + `App` provider
- [x] Flash-prevention script in `index.html`
- [x] Dark mode applied to all landing page components and `AuthModal.jsx`
- [x] Dark mode preserved on `DisputeComparison.jsx` (intentional dark styling)

### Multi-Currency Support
> Session `57201c01`.
- [x] `CurrencyContext.jsx` with live exchange-rate API
- [x] Currency dropdown in `WalletDashboard.jsx`
- [x] `formatCurrency` applied across all amount displays (WalletDashboard, BuyerDashboard, SellerDashboard, TransactionHistory, TopUpModal, WithdrawalModal)

### Admin Dashboard Full Redesign
> Session `a12e2412`. Commit `bbf396e`.
- [x] `AdminLayout.jsx`, `AdminSidebar.jsx`, `AdminHeader.jsx`
- [x] `AdminMetricCard.jsx`, `SystemHealth.jsx`, `RecentActivity.jsx`, `OverviewTab.jsx`
- [x] `AdminTable.jsx`, `AdminPagination.jsx`
- [x] `OrdersTab.jsx`, `DisputesTab.jsx`, `DeedsTab.jsx`, `KycQueueTab.jsx`, `UsersTab.jsx`
- [x] `FinancialsTab.jsx`, `SettlementsTab.jsx` + stub tabs (AuditLogs, Reports, SystemSettings)
- [x] Responsive layout, `React.memo`/`useMemo` optimisation

### NewDeedPage — Generic Form Rewrite (Pre-4-Stage)
> Session `a6d3697b`. Commit precedes `3d23e63`.
- [x] Rewrite `NewDeedPage.jsx` with generic form fields (removed niche-specific ScopeBox logic)
- [x] Milestone toggle and per-milestone breakdown UI
- [x] `orderController.createOrder` deprecated in favour of `deedController.createDeed`
- [x] Backend routing verified and payload validation tested

### Wallet & Ledger UI Full Redesign
> Session `101cbdab`.
- [x] Scaffold `src/components/wallet/`
- [x] `WalletSkeleton.jsx`, `WalletEmptyState.jsx`
- [x] `WalletHeader.jsx`, `WalletHeroCard.jsx`, `WalletInsights.jsx`
- [x] `QuickActions.jsx`, `AnalyticsSection.jsx`, `SpendingDonut.jsx`
- [x] `TransactionTable.jsx`, `TransactionRow.jsx` (migrated `TransactionHistory.jsx` logic)
- [x] `PaymentMethods.jsx`, `LedgerTimeline.jsx`
- [x] `WalletDashboard.jsx` refactored as single source of truth (single API fetch)
- [ ] ⚠️ Responsiveness verification across breakpoints (1440/1280/1024/768/480/390) — deferred
- [ ] ⚠️ Final pixel-perfect polish — deferred

---

## Part 1 — Foundation Unification: Order → Deed Migration

### Background
The legacy `Order` model was tightly coupled to everything — disputes, wallets, chat, UI.
Part 1 migrated the entire platform to use `Deed` as the sole lifecycle source of truth
and deleted `Order` from the schema entirely.

### Stage A — Dispute Entry Point Unification
> Commit `a9db152`.
- [x] Unify all dispute creation entry points to read from and write to `Deed` (not `Order`)

### Stage B — Dispute Engine / AI Decoupled from Order
> Commit `2c3107c`.
- [x] `disputeEngine.js` reads `Deed` + `WalletTransaction` ledger, not `Order`
- [x] AI evidence review (`disputeAI.js`) reads `Deed` fields, not `Order`

### Stage C — Delivery, Revision, Dispute UI Decoupled
> Commits `64d2b6f`, `bce495c`.
- [x] C2b: Full Deed-based dispute UI + backend read paths
- [x] C Final sweep: `DeliveryActions`, `RevisionModal`, `DisputeModal` decoupled from `Order`

### Stage D — Schema Unification
> Commits `28defc9`, `e00b87c`, `34af4a4`.
- [x] D1: `deedService.js`, chat, dispute resolution decoupled from `Order`
- [x] D2: Legacy `Order` model fully dropped from Prisma schema; admin + UI references cleaned
- [x] Dead `Order`-era leftovers removed from codebase

### Stage D-wallet — Wallet Balance & Ledger Fixes ⭐ LANDMARK FIX
> Session `bfe0590a`. Commit `47bbb41`.
>
> **What this fixed**: The wallet had a dual-source-of-truth bug — `wallet.balance`
> was a mutable field that could drift from the actual ledger sum. After this fix,
> balance is always derived from summing `WalletTransaction` rows via `getCalculatedBalance()`.
> This is one of the two most significant fixes in the project.

- [x] D-wallet-1: Single shared ledger-sum calculation (`getCalculatedBalance`)
  - `requestWithdrawal` now reads ledger sum, not mutable `wallet.balance`
- [x] D-wallet-2: Currency formatting fixes (`DashboardHeader.jsx`, `WithdrawalModal.jsx`)
  - `DashboardHeader` no longer hardcodes 'INR'; uses `formatCurrency`
- [x] D-wallet-3: Withdrawal modal negative-balance UX
  - Disable Withdraw button when balance ≤ 0
  - Show explanatory message for negative balance (dispute penalty debt)
  - Clamp max input to `Math.max(0, balance / 100)`
- [x] D-wallet-4: Fix test data corruption pattern
  - `resetWalletBalance(userId, targetBalance)` helper creates `TEST_ADJUSTMENT` transactions
  - `test-phase1.js`, `test-phase2.js`, `test-phase3.js` updated to use helper
  - Tests re-run and confirmed passing

---

## Part 2 — Target Dispute Architecture

### Background
Replace the old flat-field dispute system with an append-only `DisputeEvent` arbitration log.
AI-driven evidence review, challenge rounds, and mandatory human escalation for high-value/contested disputes.

### Stage A — Schema & Configuration
> Sessions `b0a19180`, `869eef5f`.
- [x] `DisputeEvent` model and `DisputeEventType` enum added to `schema.prisma`
- [x] `backend/config/disputeConfig.js` created with locked thresholds:
  - `HIGH_VALUE_THRESHOLD_INR = 10000` (₹100 in paise — auto-escalates to human)
  - `AI_MIN_CONFIDENCE = 70` (below this → escalate)
- [x] `DeedDisputeStatus` remapped to: `OPEN`, `CHALLENGE_PHASE`, `ESCALATED`, `RESOLVED`
- [x] Legacy JSON fields on `DeedDispute` marked `@deprecated` (replaced by `DisputeEvent`)
- [x] `npx prisma db push` run; DB tables verified

### Stage B — API Endpoints & Event Ingestion
> Sessions `b0a19180`, `869eef5f`.
- [x] `POST /api/disputes/deed/:id/evidence` — creates `EVIDENCE_SUBMITTED` event; flags late if 24–48h
- [x] `POST /api/disputes/deed/:id/challenge` — creates `CHALLENGE` event; enforces 1-per-side limit
- [x] 24h/48h timeout enforcement; 1-challenge-per-party limits
- [x] Race conditions fixed using raw `prisma.disputeEvent.count()` queries

### Stage C1 — Lazy-Eval Timeout Wrappers
> Session `869eef5f`.
- [x] Wrapper 1: `OPEN` → AI trigger — atomic 60s debounce lock (fires when both evidence submitted or 48h elapsed)
- [x] Wrapper 2: `CHALLENGE_PHASE` → `RESOLVED` — atomic status compare-and-swap (48h after AI report posted)
- [x] Active single-challenge AI re-analysis triggered immediately (not deferred)

### Stage C2 — AI Prompt & Ledger Integration
> Session `869eef5f`.
- [x] `generateAIReport` in `disputeAI.js` — consumes full `DisputeEvent` log
- [x] Fetches all evidence + challenges + original report from ledger
- [x] `isLate` flag injected into AI prompt; late submissions weighted negatively
- [x] Pre-write guard `if (currentDispute.status === 'ESCALATED') return;` added
- [x] Tested end-to-end (`test-stage-c2.js` passes with expected LLM reasoning)

### Stage C3 — Value-Threshold Dual-Flow & Confidence Wiring
> Session `869eef5f`.
- [x] Dual-flow at dispute creation: below `HIGH_VALUE_THRESHOLD` → full challenge round; at/above → direct `ESCALATED`
- [x] Confidence-threshold check on **first-pass AI report** (< 70% → escalate immediately)
- [x] Confidence-threshold check on **single-challenge re-analysis report** (< 70% → escalate)
- [x] Both-parties-challenged → always `ESCALATED` (bypasses confidence check entirely)

### Stage D — Human Decision, Settlement & Dual 2% Fee Refactor
> Sessions `869eef5f`, `b0a19180`. Commit likely in `e00b87c`-adjacent work.
- [x] D1: Refactor `calculateResolutionAmounts` — fix 100% blind spot:
  - Both parties pay 2% arbitration fee even when one receives 0% of the principal
  - `sellerNet` can go negative (wallet debt) — this is intentional, Prisma `Int` supports it
  - Loser's fee charged against their wallet balance regardless of current balance
- [x] D2: `POST /api/disputes/admin/:id/decision` endpoint built:
  - Accepts `action` + `buyerPct`; validates dispute is `ESCALATED`
  - Auto-triggers settlement (no separate `/settle` step)
  - Writes `HUMAN_DECISION` + `SETTLEMENT` events to `DisputeEvent`
  - Updates deed to `CLOSED`
- [ ] D3 (PARTIAL): Admin stale-dispute query filter — **not confirmed complete**
- [ ] D3 (PARTIAL): Admin dashboard enum-conflation cleanup — **not confirmed complete**

---

## Phase 1–3 — Fee Engine (New Naming, Post Part-1)
> Commits `1d8df32`, `20dbabe`, `5cb15d6`, `a3de240`.

### Phase 1 — Zero-Fee Top-Ups & Withdrawals
- [x] Zero-fee top-ups (no platform fee on wallet funding)
- [x] Zero-fee withdrawals (no fee on seller payout)
- [x] `test-phase1.js` passes

### Phase 2 — 2.5% Seller Fee on Release
- [x] `releaseDeed()` deducts 2.5% from seller's share
- [x] `test-phase2.js` passes (including paise-correct math)

### Phase 3 — Tiered Dispute Fee Engine
- [x] Tiered dispute fees by resolution type: RESOLVED vs ESCALATED
- [x] Remainder-safe math (`Math.floor` throughout, no float drift)
- [x] `test-phase3.js` passes
- [x] Phase 2 and Phase 3 test scripts restored as permanent regression suite

### Phase 4 — Fee Model UI Transparency
> Commit `d9781aa`.
- [x] Buyer and seller see fee breakdown in deed detail, checkout, and release flows

---

## 4-Stage NewDeedPage Architecture
> Commits `3d23e63`, `bb4f157`, `2dd3432`. Session `a6d3697b` (prior generic-form foundation).

- [x] Stage 1: Basic deed details (title, description, amount, deadline)
- [x] Stage 2: Deliverable formats and acceptance criteria
- [x] Stage 3: Review + confirmation screen
- [x] Stage 4: Payment / escrow funding (Razorpay integration)
- [x] Autosave between stages
- [x] Stage 4 `Lock` import crash fixed
- [x] Stage 3 review confirmation UX added

---

## Payment Flow Hardening (2026-07-20) ⭐ LANDMARK FIX
> Commits `7764b43`, `32cf79f`, `9e444e6`. Session `7ed1fc2c`.
>
> **What this fixed**: Two confirmed TOCTOU race conditions (`topUpWallet`, `fundDeed`),
> a false-success UI bug ("Deed Secured!" shown on poll timeout even when deed still DRAFT),
> a disabled `verifyPayment` endpoint restored with security hardening, a wallet balance
> display bug (INITIATED transactions appearing as real credits), and a data-mapping bug
> (deed detail page reading legacy `scopeBox` JSON instead of first-class `Deed` columns).
> Proved idempotent under concurrent load via `test-idempotency.js` (Promise.all dual-fire).
> This is the second most significant fix in the project.

- [x] False-success UI bug fixed:
  - `setShowSuccess(true)` no longer called on poll timeout
  - "Deed Secured!" screen only shown when backend confirms deed status changed
  - `MAX_ATTEMPTS` named constant restored
  - Operator-precedence bug on line 221 fixed
- [x] `topUpWallet` TOCTOU race condition fixed:
  - `SELECT ... FOR UPDATE` row lock on wallet
  - SUCCESS idempotency guard: returns early if same `razorpayOrderId` already has SUCCESS tx
  - INITIATED → SUCCESS upgrade path preserved inside transaction
- [x] `fundDeed` TOCTOU race condition fixed:
  - Deed status re-read **inside** `prisma.$transaction` after acquiring wallet lock
  - Second concurrent caller sees `PENDING_SELLER` on re-read and throws `DEED_NOT_IN_DRAFT_STATE`
- [x] `verifyPayment` endpoint restored from disabled stub:
  - HMAC-SHA256 signature verification (`razorpayOrderId|razorpayPaymentId`, `RAZORPAY_KEY_SECRET`)
  - No secret/signature logging; no stack trace in HTTP responses
  - Idempotency guard: if deed already `!== DRAFT`, returns 200 immediately
  - Missing-field validation before any DB/crypto work
  - `walletService` import added to `deedController.js`
- [x] Wallet balance display bug: INITIATED transactions excluded from balance display
- [x] Deed detail page field-mapping bug:
  - Page now reads first-class `Deed` columns (`title`, `amount`, `deliverableFormats`, etc.)
  - No longer falls back to legacy `scopeBox` JSON for new-flow deeds
  - Invite link correctly retrieved via `deed.inviteToken`
- [x] Server startup crash fixed: missing closing brace in `paymentController.js` catch block

---

## Open / Known Gaps

- [ ] **KG-1 — `disputeEngine.js` scopeBox subcategory fields (MEDIUM RISK)**
  - `disputeEngine.js` reads `deed.scopeBox.contentWritingSpecific.wordCount` (L99) and
    `deed.scopeBox.logoSpecific.fileFormats` (L105) — neither is populated by the 4-stage flow.
  - For new-flow deeds: `promisedWordCount = 0`, `fileFormats = []`.
    Content-writing disputes evaluate as if 0 words were promised → incorrectly lenient.
    Logo disputes evaluate as if no file formats required → incorrectly lenient.
  - Resolution path: decide whether `acceptanceCriteria` (free text, already on `Deed`) is
    sufficient for the dispute engine, OR add structured `wordCount`/`fileFormats` columns
    to the `Deed` schema and update `disputeEngine.js` to read them.
  - **Schema design decision required before implementing — do not fix unilaterally.**
  - Identified: 2026-07-20.

- [ ] **KG-2 — Regression test coverage gap (LOW-MEDIUM)**
  - `tests/` covers wallet/fee logic but NOT the 4-stage `NewDeedPage` flow, `fundDeed`,
    or `verifyPayment` end-to-end.
  - `test-idempotency.js` covers TOCTOU fixes but nothing else in the new payment path.
  - Action: add E2E tests for the full buyer flow once architecture stabilises.

- [ ] **KG-3 — `productCategory` field missing on `Deed` schema (LOW, deferred)**
  - The new 4-stage deed creation flow uses a generic `transactionType` field, but the old
    ScopeBox system had niche-specific product categories (logo, content writing, software, etc.)
    which drove the dispute engine's category-specific evidence rules.
  - No first-class `productCategory` column exists on the `Deed` model; this affects
    `disputeEngine.js` category branching and any future analytics/filtering by category.
  - Decision needed: keep generic `transactionType` + expand dispute engine, or add
    `productCategory` enum column to `Deed`.

- [ ] **KG-4 — Physical-goods tracking schema (NOT STARTED)**
  - ScrowX currently has no schema or flow for physical goods escrow (where a tracking number,
    carrier, and delivery confirmation are required before release).
  - Current `Deed` model has no `trackingNumber`, `carrier`, or `deliveryConfirmedAt` fields.
  - Needs product decision and schema design before any implementation.

- [ ] **KG-5 — Gemini model version pinning (LOW, hygiene)**
  - `disputeAI.js` and related AI services reference a Gemini model string that may not be
    pinned to a specific version (e.g., `gemini-pro` instead of `gemini-1.5-pro-002`).
  - Risk: silent model upgrades from Google could change AI reasoning/output format without
    notice, breaking dispute resolution logic or structured JSON output parsing.
  - Action: audit `disputeAI.js` and pin to a specific dated model version.
    Add to memory.md when confirmed.

- [ ] **KG-6 — Debt collection / recovery mechanism (MEDIUM, product decision needed)**
  - When a dispute penalty reduces a user's wallet balance to negative (e.g., loser pays 2%
    from an empty wallet), the balance goes to `-N paise`. Prisma `Int` supports this natively
    and it was intentionally allowed (freezing the transaction would block resolution).
  - No mechanism exists to: block new deed creation while a user is in debt, auto-deduct
    from future earnings, notify the user, or escalate unpaid debt to the platform.
  - Product decision required: what happens when a user owes the platform money?
  - Identified: Part 2 Stage D design discussion.

- [ ] **KG-7 — Deed auto-release cron (NOT STARTED)**
  - Deeds should auto-release to the seller if the buyer does not raise a dispute within
    a configurable window after the seller marks delivery complete.
  - A stub/flag exists (`2891648` — cron job flag) but no actual cron job or scheduler
    logic has been implemented for deed auto-release.
  - The `ChatExpiry` cron (seen in server startup) is unrelated.
  - Needs: cron scheduler entry in `server.js`, configurable release window on `Deed`,
    and a `autoReleaseAt` timestamp set when seller marks delivery.

- [ ] **KG-8 — Per-flag fault UI in dispute analysis (NOT STARTED)**
  - The AI dispute analysis returns a verdict with a confidence score and flags per-party faults.
  - The admin dashboard does not currently show a per-flag breakdown UI — only the overall
    verdict is displayed.
  - Needs: admin dispute detail view showing each `DisputeEvent` entry with its payload,
    the AI report's structured fault flags, and the final HUMAN_DECISION if present.

- [x] **KG-9 — Stage D3 admin cleanup (RESOLVED 2026-07-21)**
  - Stale-dispute filter: ✅ done (`admin.js` L97–106, `DisputesTab.jsx` staleFilter checkbox).
  - Backend stats all-4-statuses breakdown: ✅ done (`admin.js` L56–60).
  - **Bug 1 fixed** — Enum mismatch in status dropdown (`DisputesTab.jsx` L65):
    `value="CHALLENGE"` → `value="CHALLENGE_PHASE"`. Challenge filter now correctly matches
    the DB enum and returns results.
  - **Bug 2 fixed** — Legacy `d.order?.` references replaced with correct `d.deed?.` paths
    (`DisputesTab.jsx` L108, 115, 119). API response shape confirmed from `admin.js` L134–140:
    backend pre-composes `deed.buyerName` (`"${buyer.firstName} ${buyer.lastName}"`) and
    `deed.sellerContact` (seller email string) — they are NOT nested objects.
    Fixed: `d.order?.id` → `d.deed?.id`; `d.order?.buyer?.firstName` → `d.deed?.buyerName`;
    `d.order?.seller?.firstName` → `d.deed?.sellerContact`.
  - Note: my initial KG-9 description guessed `d.deed?.buyer?.firstName` as the fix —
    that was also wrong. Correct path confirmed from the actual backend code before applying.

- [ ] **KG-10 — Wallet & Ledger UI responsiveness (deferred, patterns present)**
  - **Code-verified 2026-07-21.** The responsive patterns are in place:
    `WalletHeroCard` uses `md:p-8`, `md:text-5xl`, `lg:flex-row`, `sm:grid-cols-3`;
    `WalletDashboard` uses `grid-cols-1 lg:grid-cols-12`;
    `TransactionTable` uses `overflow-x-auto` with `min-w-[800px]` (correct mobile scroll pattern).
  - **What's missing**: formal visual verification at the specific breakpoints (1440/1280/1024/
    768/480/390) was never completed. The code *should* work, but it hasn't been confirmed
    with eyes on the actual rendered output at each breakpoint.
  - Final pixel-perfect polish pass also not done.
  - Low priority while backend architecture is in flux.
