# ScrowX — Task Tracker

## How to use this file
- This is the canonical checklist for all work stages on ScrowX.
- Mark items `[/]` when starting, `[x]` when done, `[ ]` when not started.
- Add new tickets below the last stage. Never delete completed tickets — they're permanent record.
- Last updated: 2026-07-21

---

## Phase 1 — Zero-Fee Top-Ups & Withdrawals
- [x] Implement zero-fee top-ups
- [x] Implement zero-fee withdrawals
- [x] Test and verify

## Phase 2 — 2.5% Seller Fee on Release
- [x] Implement seller fee on `releaseDeed()`
- [x] Atomic top-up double-payment prevention (row-level lock)
- [x] Graceful polling for concurrent Razorpay orders + cron job flag
- [x] Test regression suite (`test-phase2.js`)

## Phase 3 — Tiered Dispute Fee Engine
- [x] Implement tiered dispute fee with remainder-safe math
- [x] Test regression suite (`test-phase3.js`)
- [x] Restore Phase 2 and Phase 3 test scripts as permanent regression suite

## Phase 4 — Fee Model UI Transparency
- [x] UI shows fee breakdown to buyer and seller
- [x] Fee model displayed in deed detail, checkout, and release flows

## Phase 10 — Performance & SEO
- [x] Phase 10.2: Admin queue pagination + N+1 query fixes
- [x] Phase 10.3: react-helmet-async SEO tags + route-level lazy loading

## Stage A — Dispute Entry Point Unification
- [x] Unify all dispute entry points to read from Deed (not Order)

## Stage B — Dispute Engine / AI Decoupled from Order
- [x] Dispute engine reads Deed + Ledger, not Order
- [x] AI evidence review reads from Deed

## Stage C — Delivery, Revision, Dispute UI Decoupled
- [x] DeliveryActions, RevisionModal, DisputeModal decoupled from Order
- [x] Full Deed-based dispute UI + backend read paths
- [x] Stage C final sweep

## Stage D — Schema Unification
- [x] D1: deedService / chat / dispute resolution decoupled from Order
- [x] D2: Legacy Order model fully dropped from schema, admin + UI fixes
- [x] Dead Order-era leftovers removed (`34af4a4`)

## Stage D-wallet — Wallet Balance & Ledger Fixes
- [x] D-wallet-1: Single shared ledger-sum calculation (`getCalculatedBalance`)
- [x] D-wallet-2: Currency formatting fixes (DashboardHeader, WithdrawalModal)
- [x] D-wallet-3: Withdrawal modal negative-balance UX (disable, clamp, message)
- [x] D-wallet-4: Fix test data corruption pattern (TEST_ADJUSTMENT helper)

## Admin Dashboard
- [x] Admin dashboard UI/UX (`bbf396e`)

## 4-Stage NewDeedPage Redesign
- [x] Autosave + 4-stage workflow (`3d23e63`, `bb4f157`)
- [x] Stage 4 Lock import crash fix + Stage 3 review confirmation (`2dd3432`)

## Payment Flow Hardening (2026-07-20)
- [x] False-success UI bug fixed (success only shown on backend confirmation, not poll timeout)
- [x] `topUpWallet` TOCTOU race condition fixed (SELECT FOR UPDATE + SUCCESS idempotency guard)
- [x] `fundDeed` TOCTOU race condition fixed (deed status re-read inside lock)
- [x] `verifyPayment` endpoint restored from disabled stub + security hardened
- [x] Wallet balance display bug: INITIATED transactions no longer shown as real credits
- [x] Deed detail page field-mapping bug: reads first-class Deed columns, not legacy scopeBox JSON
- [x] Server startup crash fixed: missing closing brace in paymentController.js (`9e444e6`)

## Open / Known Gaps

- [ ] **KG-1 — disputeEngine.js scopeBox subcategory fields (MEDIUM RISK)**
  - `disputeEngine.js` reads `deed.scopeBox.contentWritingSpecific.wordCount` and
    `deed.scopeBox.logoSpecific.fileFormats` which are never populated by the 4-stage flow.
  - For new-flow deeds, both default to 0/[] → dispute engine evaluates content-writing
    disputes as if 0 words were promised; logo disputes as if no formats required.
  - Resolution: decide whether `acceptanceCriteria` (free text) is sufficient, OR add
    structured `wordCount`/`fileFormats` columns to Deed schema and update disputeEngine.
  - **Schema decision needed before implementing** — do not fix unilaterally.
  - Identified: 2026-07-20

- [ ] **KG-2 — Regression test coverage gap**
  - `tests/` covers wallet/fee logic but NOT NewDeedPage 4-stage flow, fundDeed, or
    verifyPayment end-to-end.
  - Idempotency test (`test-idempotency.js`) covers TOCTOU fixes but nothing else in
    the new payment path.
  - Action: add E2E tests for the full buyer flow once the architecture stabilises.
