# ScrowX — Architecture Memory & Session State

> **Usage rule:** This file gives starting context for each new session. It is NOT evidence
> that anything works. Always verify claimed fixes against actual code/tests/DB output.
> Updated at the end of each work session.

---

## Last Updated

2026-07-21 (session: 7ce56008 — context recovery, task.md/memory.md establishment, KG-9 admin bug fixes)

---

## Project Overview

**ScrowX** is a full-stack escrow platform (freelance/service agreements).
- **Stack:** Node.js/Express backend, React/Vite frontend, PostgreSQL via Prisma ORM.
- **Deployment target:** Render (backend) + Netlify (frontend).
- **Payment provider:** Razorpay (INR, also supports multi-currency display).
- **Real-time:** Socket.IO for chat and deed lifecycle events.

---

## Core Architectural Decisions (Locked In)

### 1. `Deed` is the sole lifecycle source of truth
The legacy `Order` model is **fully deleted** — schema, service, controller, UI, all of it.
Every transaction, dispute, and fee calculation reads from `Deed` and its related ledger tables.
Do NOT reference Order anywhere. If you see it, it's a bug.

### 2. Money is stored in paise/cents (subunits)
All monetary fields in the DB are in the smallest currency unit (paise for INR).
₹100 = 10000 in the DB. This has caused real bugs before.
Formatting is done in the UI layer via `formatCurrency()` helpers. Never store or compare
major-unit values in the backend.

### 3. Wallet ledger is append-only
Wallet balance is derived from summing `WalletTransaction` rows, not from a mutable
`wallet.balance` field. The `getCalculatedBalance()` / `getWalletSummary()` functions
are the canonical way to read a user's balance. INITIATED transactions are **not** counted
as real credits — only SUCCESS transactions count.

### 4. Atomic DB guards for concurrency
Any function that both reads and writes wallet/deed state in a single logical operation
must use `prisma.$transaction` with `SELECT ... FOR UPDATE` row locks.
Two operations have been hardened this way (as of 2026-07-20):
- `walletService.topUpWallet()`: lock → idempotency check → upgrade/create → increment
- `deedService.fundDeed()`: lock → re-read deed status inside transaction → decrement

### 5. Dispute system — append-only `DisputeEvent` table
Disputes use an append-only event log (`DisputeEvent`) with AI-driven evidence review,
challenge rounds, and human escalation for high-value/contested disputes.
The dispute engine reads category metadata from `deed` columns, not from `scopeBox`
(scopeBox is legacy, mostly dead — see Known Gaps).

### 6. Payment flow (post 2026-07-20 fix)
```
User pays via Razorpay →
  PRIMARY: POST /api/deeds/:id/verify-payment
    → HMAC verified → topUpWallet (locked) → fundDeed (locked) → 200 OK
    → Frontend: "Deed Secured!" ✅
  FALLBACK (if PRIMARY fails): Poll GET /api/deeds/:id every 3s × 20
    → status !== 'DRAFT' → "Deed Secured!" ✅
    → timeout (60s) → honest error toast → navigate('/buyer/dashboard') ❌
  PARALLEL: Razorpay webhook (idempotent — no-op if PRIMARY already ran)
```
The `verifyPayment` endpoint is **enabled** (was previously disabled stub, restored 2026-07-20).
No secret/signature/stack leakage in HTTP responses.

### 7. Chat Authorization is Status-Agnostic
The backend (`chatController.js`, `chatSocket.js`) authorizes chat access purely by participant identity (`buyerId` / `sellerId`), NOT by `deed.status`. The backend perfectly permits chat at any state (e.g. `PENDING_SELLER`, `ACTIVE`, `IN_PROGRESS`). Any status-based chat restrictions (like `CHAT_ELIGIBLE`) exist entirely in the frontend and are considered UI bugs if they block live deeds.

---

## Development Environment Notes

- Backend: `node server.js` — defaults to port 3000, auto-retries on 3001 if in use.
- Frontend: `npm run dev` — Vite on port 5173 (retries on 5174 if in use).
- Razorpay webhooks cannot reach `localhost` — that's expected. The `verifyPayment`
  endpoint is the synchronous confirmation path for local dev.
- DB: PostgreSQL. Prisma migrations live in `prisma/schema.prisma`.
  Run `npx prisma db push` (not `migrate deploy`) for schema changes in dev.

---

## What Was Actually Fixed (with commit refs)

| Commit | What it fixed |
|--------|---------------|
| `8796dcd` | Invite flow Bug A + B: `InviteLinkBanner` `/invite/` → `/deed/invite/` (was 404); post-accept redirect `order.id` → `deed.id`, `/seller/order/undefined` → `/seller/deed/:id`. E2E verified. |
| Pending | KG-25: Restored Chat functionality on `ACTIVE` deeds by removing dual-layer frontend status blacklist in `DeedDetails.jsx` and `OrderChat.jsx`. |
| Pending | KG-26: Fixed `inProgress` dashboard metric undercounting by switching filters to `['PENDING_SELLER', 'ACTIVE', 'IN_PROGRESS']`. |
| Pending | KG-27: Cosmetic Legacy Status Purge. Removed dead status strings from all dictionaries, removed unused timeline steps, removed unreachable grace-period hack in DeedDetails. |
| Pending | KG-24: Removed dead Order acceptance flow from SellerDashboard.jsx. Flow was mathematically unreachable because `sellerId` is only assigned after invite acceptance. |
| `fb83f5e` | KG-28A: Dashboard metrics correction. Fixed `BuyerDashboard.jsx` using `CLOSED` instead of `RELEASED` for completed metric. Seller earnings explicitly deferred. |
| `4b1a8d9` | KG-28B: `DeliveryActions.jsx` optimistic update aligned to backend. Pushes local state to `CLOSED` instead of `RELEASED`. |
| `c0adbe9` | KG-29: `DeedsTable.jsx` logic duplication cleanup. Fixed the visual bug (fallback "Pending" badge) by removing dead grace-period hack. Removed unreachable `RELEASED` string from filter. |
| `1b3e945` | KG-29.1: Final Legacy Deed Status Removal. Cleaned up dead `RELEASED`/`COMPLETED` strings from `DeedDetails.jsx` review banner. Verified 100% legacy status eradication. |
| `a47f920` | KG-30A: Backend Financial Summary Engine Refactor. Rewrote `walletService.getWalletSummary` to use O(1) memory Prisma SQL aggregates instead of O(N) JS array processing. Solved architectural domain leak by deriving finances from `WalletTransaction`. |
| `6ab1c3d` | KG-30B: Frontend Wiring. Replaced `SellerDashboard.jsx` manual array reduce calculation for `totalEarnings` with `walletSummary.lifetimeEarnings`. Removed all frontend financial derivations. |
| `8b209d1` | KG-30C: Dashboard Cleanup & Final Certification. Replaced deprecated fields in `WalletInsights.jsx` and `WalletHeroCard.jsx` with strict ledger values. Verified 0 occurrences of `.reduce()` and deed-amount financial derivations remaining project-wide. |
| `f93e2b2` | KG-31B & KG-31C: Wallet UI Semantic Reconciliation. Forked `WalletHeroCard` and `WalletInsights` semantics based on `isBuyer`. Removed hardcoded zero values. Preserved API performance by avoiding premature buyer analytics. |
| `b049d52` | Repository Cleanup. Deleted orphaned wallet components and root scratch scripts. Cleaned dead imports and variables from heavily modified lifecycle components (`DeedDetails.jsx`, `SellerDashboard.jsx`, etc.). 100% build verified. |
| `6030b4f` | KG-9: `DisputesTab.jsx` — `CHALLENGE` → `CHALLENGE_PHASE` enum fix; `d.order?.` → `d.deed?.` refs fixed |
| `97540fc` | `task.md` + `memory.md` added to project root; 3 investigation script stragglers deleted |
| `9e444e6` | Missing closing brace in `paymentController.js` catch block — server startup crash |
| `32cf79f` | Deed detail page reading wrong fields (legacy `scopeBox` JSON vs first-class columns) |
| `7764b43` | False-success UI bug, TOCTOU race conditions in `topUpWallet`/`fundDeed`, `verifyPayment` endpoint restored + hardened |
| `2dd3432` | Stage 4 `Lock` import crash + Stage 3 review confirmation |
| `bb4f157` | 4-stage `NewDeedPage` architecture redesign |
| `47bbb41` | Wallet balance dual-source-of-truth bug |
| `e00b87c` | Schema unification: legacy Order dropped, admin + UI fixes |
| `28defc9` | Stage D1: deedService/chat/dispute decoupled from Order |
| Earlier | Full dispute system, fee engine (Phases 1–3), admin dashboard, SEO/lazy loading |

---

## Known Gaps / Open Work (see task.md for detail)

See `task.md` KG-1 through KG-10 for full detail. Summary of open items:

| ID | Risk | Summary |
|----|------|---------|
| KG-1 | Medium | `disputeEngine.js` reads `scopeBox.contentWritingSpecific.wordCount`/`logoSpecific.fileFormats` — never populated by 4-stage flow. Schema decision needed. |
| KG-2 | Low-Med | No E2E tests for `NewDeedPage` 4-stage flow, `fundDeed`, or `verifyPayment`. |
| KG-3 | Low | `productCategory` field missing on `Deed` schema — dispute engine category branching affected. |
| KG-4 | — | Physical-goods tracking schema not started (`trackingNumber`, `carrier`, `deliveryConfirmedAt`). |
| KG-5 | Low | Gemini model version not pinned in `disputeAI.js` — silent upgrade risk. |
| KG-6 | Medium | No debt collection mechanism for negative wallet balances from dispute penalties. Product decision needed. |
| KG-7 | — | Deed auto-release cron not implemented. Cron flag stub exists (`2891648`) but no scheduler logic. |
| KG-8 | — | Per-flag fault UI in admin dispute detail not built. |
| KG-9 | ✅ | RESOLVED 2026-07-21: stale filter working; enum mismatch + legacy `d.order` refs fixed in `DisputesTab.jsx`. |
| KG-10 | Low | Wallet UI responsive patterns in code but formal breakpoint verification never done. |
| KG-11 | Low | AI prompt phrasing conflates 'late' with 'absent' when `isLate` is true, causing confusing reasoning text. |
| KG-12 | High | Admin Timeline reads from legacy `dispute.timeline` JSON column instead of the new `DisputeEvent` ledger. |
| KG-13 | High | Missing Challenge UI. Frontend uses legacy `Smart Escalate` button that bypasses the challenge round. |
| KG-14 | Low | Admin UI confidence score multiplies by 100 incorrectly (`Math.round(value * 100)`). |
| KG-15 | Low | Admin UI Platform Fee is hardcoded to 5% instead of the 2% defined in the Fee Engine. *(Incomplete - top header missed)* |
| KG-16 | Low | Admin Order Snapshot looks for legacy `scopeBox` fields instead of native `deed` fields, causing 'Unknown' displays. |
| KG-17 | Low | Admin UI hardcodes `$` and double-divides financial values by 100, turning ₹100 into $1.00. |
| KG-18 | High | KYC Gate threshold bug. Fixed in `8a35054` but explicitly flagged: improperly bundled with unrelated frontend fix (KG-19) without diff-review. |
| KG-19 | Low | Challenge UI doesn't visually update after submission, leading to duplicate submissions and 400 errors. |
| KG-20 | High | `submitChallengeEvent` escalates the dispute without emitting an observable `DisputeEvent` or updating the timeline. |
| KG-21 | High | Backend data-integrity bug: old resolution route successfully updated `deedDispute` but crashed before updating `deed` status, causing silent desync. (Fixed via transactional rewrite). |
| KG-22 | Medium | `EnhancedDisputeResolution` toast error messages are generic ("Failed to resolve dispute"); they now correctly surface the detailed backend 400 error messages (e.g., "Cannot refund a deed that has not been funded yet"). |
| KG-23 | Medium | The architecture doc states "Socket.IO for chat and deed lifecycle events", but actual backend implementation ONLY wires up chat. Deed lifecycle events (e.g., `acceptDeed`) do not emit global socket events. This means real-time dashboard updates currently require polling rather than listening for socket emissions. |

---

## Files That Are Permanently Tracked (do not delete)

- `tests/test-phase1.js`, `test-phase2.js`, `test-phase3.js` — fee engine regression suite
- `tests/test-idempotency.js` — TOCTOU/double-payment regression suite
- `tests/test-concurrency.js` — concurrency harness
- `backend/scripts/seedAdmin.js` — admin seeder (committed, intentional)

## Files That Should NOT Exist in the Repo

- Any `backend/scripts/investigate_*.js` — one-off investigation scripts, delete after use
- Any `backend/scripts/verify_*.js` — same
- Any scratch/test files not in `tests/`
