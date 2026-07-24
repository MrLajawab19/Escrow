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
| KG-15 | Low | Admin UI Platform Fee is hardcoded to 5% instead of the 2% defined in the Fee Engine. |

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
