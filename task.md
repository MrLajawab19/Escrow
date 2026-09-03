# ScrowX — Comprehensive Task & History Tracker

## Dark Mode — Remaining Work (Paused)

### 1. Status Summary
**Completed & Visually Verified:**
- **Stage 1 (Shared Primitives & Modals):** Applied baseline dark mode tokens. Note: Re-auditing shows a few residual occurrences (`bg-white` edge cases) still exist in these files (e.g. `WithdrawalModal.jsx`, `TopUpModal.jsx`, `DisputeModal.jsx`, `ReviewModal.jsx`, `ChangesReviewModal.jsx`) that need a final polish sweep.
- **Stage 2 (Heavy-weight Flows):** `NewDeedPage.jsx`, `DisputeResolutionFlow.jsx`, `DisputeTracker.jsx`, `AdminDisputeDetails.jsx` are functionally converted and visually verified. (Note: `NewDeedPage.jsx` has ~11 residual occurrences to polish).

**Explicitly Excluded (Deprioritized):**
- **Admin Dashboard (19 files + AdminLogin.jsx + AdminDashboard.jsx):** Reverted to light-mode via `git restore`. Explicitly skipped to avoid shipping unverified structural styling changes to an internal-only tool. Marked as excluded in `dark_mode_audit.md`.

### 2. Exact Remaining File List (Stage 4 - The Long Tail)
Total remaining files requiring systematic attention: 46 (plus minor cleanups on Stage 1/2 files).

**GROUP 1 — Remaining Modals & Small Shared Components**
*Status: Completed. [x] **Group 1 (Remaining Modals & Small Components)**
- NotificationModal.jsx, EditProfileModal.jsx, RevisionModal.jsx, AuthModal.jsx, TermsModal.jsx, ThemeToggle.jsx, DeedCard.jsx, NotificationDropdown.jsx.*

**GROUP 2 — Wallet & Transaction Components**
*Status: Completed. [x] **Group 2 (Wallet & Transaction Components)***
- `TransactionHistory.jsx`
- `LedgerTimeline.jsx`
- `SpendingDonut.jsx`
- `WalletHeader.jsx` (both occurrences)
- `PaymentMethods.jsx`
- `WalletOverviewCard.jsx`
- `WalletInsights.jsx`
- `QuickActions.jsx` (wallet + dashboard versions)
- `WalletHeroCard.jsx`
- `WalletDashboard.jsx`
- `RecentTransactions.jsx`
- `dashboard/QuickActions.jsx`

**GROUP 3 — Standalone Pages & Order Flow**
*Status: Completed. [x] **Group 3 (Standalone Pages & Order Flow)***
- `DeedDetails.jsx`
- `DeedSigningPage.jsx`
- `DeedInvitePage.jsx`
- `DeedMilestonePage.jsx`
- `BuyerProfilePage.jsx`
- `SellerProfilePage.jsx`
- `AuditLedgerPage.jsx`
- `OrderChat.jsx`
- `OrderTimeline.jsx`
- `DeliveryActions.jsx`
- `MilestoneList.jsx`
- `SellerDeliverySubmit.jsx`
- `FooterSection.jsx`
- `DisputeComparison.jsx`
- `ScopeBoxPreview.jsx`
- `EnhancedDisputeResolution.jsx`
- `SellerDashboard.jsx` (remaining occurrences)
- `App.jsx` (remaining occurrences)

### 3. Established Process/Standard (Mandatory for Resumption)
1. **Pre-Check:** Before any bulk replacement on a file, check for semantic color exceptions (destructive/danger buttons, status-specific colors, anything where a color's MEANING matters, not just its role as background/text/border). Report any exceptions found and how they were handled.
2. **Token Mapping:** Apply the `dark:` token mappings using only the existing tokens (`dark-bg`, `dark-surface`, `dark-elevated`, `dark-border`, `dark-primary`, `dark-muted`, `dark-accent`) plus the established semantic-color pattern for status colors (e.g. `bg-red-50 dark:bg-red-900/20`, `text-red-600 dark:text-red-400`).
3. **Hex Code Sweep:** Check for hardcoded hex values (`/#[0-9a-fA-F]{3,6}/g`) in EVERY file, not just the ones that seem likely to have them.
4. **Visual Verification:** AFTER each group (not individual files, but after Group 1, then Group 2, then Group 3), capture REAL screenshots (light and dark) of at least 2-3 representative components/pages from that group using existing test data. If browser automation fails, report exactly which files went unverified. **DO NOT report a group as completed based on a passing build alone.**
5. **Flagging Unreachable States:** If any file in a group cannot be reasonably verified, flag it by name rather than silently letting it ride on "the script ran successfully."

### 4. Known Open Items
- **Flash of Wrong Theme:** `[x]` Confirmed `index.html` inline script is still fully functioning.
- **Header Contrast:** `[x]` Confirmed `DashboardHeader` / KYC banner shade is correct in both modes.
- **DeedDetails Outer Wrapper:** `[x]` Fixed. Removed hardcoded `bg-[#F6F9FC]` missing the dark variant on the outer wrapper.

### 5. Final Dark Mode Polish
- [x] Re-audit Group 1 and 2 to confirm no stragglers remain.
- [x] Investigate SellerProfilePage.jsx and fix missing dark mode classes.
- [x] Apply fixes to remaining ~540 genuine gaps across the codebase.
- [x] Produce final verification report confirming "complete" status, justifying remainders. (e.g., the Wallet Overview gradient card intentionally excluded, or `DisputeComparison.jsx` intentionally dark).
- [x] Perform a full manual click-through (homepage -> buyer flow -> seller flow -> every sidebar item -> every modal) in dark mode with screenshots as the absolute final definition of "done."

## Deferred: Seller Reject Invite Flow

Investigated but NOT built. Findings on record:
- DeedInvitePage.jsx currently only offers "Accept Deed & Start Order" — no 
  reject/decline option exists.
- No working backend route exists for a seller to reject a PENDING_SELLER 
  invite. Existing /reject and /reject-changes routes don't apply to this stage.
- deedService.refundBuyer() exists but has NOT been verified to correctly move 
  real funds yet — needs the same scrutiny as the earlier settlement-transaction 
  fix before anything is built on top of it.
- Currently, if a seller ignores an invite, funds sit locked indefinitely — only 
  the buyer manually cancelling reclaims them. No expiry sweep/cron exists.
- Scope when picked up: REJECT ONLY (seller declines, buyer auto-refunded, deed 
  marked CANCELLED with clear audit trail). "Request Changes" (negotiation loop) 
  is explicitly out of scope until separately requested.

## Known Issues — Unverified Test Failures (Logged During Cleanup)

Discovered while migrating/consolidating test files into tests/. NOT yet root-
caused. Test files themselves were left as-is, uncommitted assumptions were not 
made about severity.

### 1. tests/test-concurrency.js — fundDeed failure
- Status: FAILING as of this session.
- Unknown whether this is a pre-existing bug (predating this cleanup session) or 
  something affected by the file migration itself. Not yet distinguished.
- The original test-file inventory (earlier in this same session) reported this 
  test as "Healthy" before the migration — meaning either something in the 
  migration affected it, or the original healthy-check wasn't rigorous enough. 
  Needs investigation to determine which.
- Actual error output was NOT yet captured/reviewed in detail.

### 2. tests/test-arbitration-pipeline-routing.js — simulated-failure case
- Status: FAILING (specifically the simulated Pipeline-2-failure/fallback test 
  case) as of this session.
- Explanation offered was "a known Node.js quirk with mocking a destructured 
  require" — this was NOT independently verified and should not be trusted at 
  face value.
- This test specifically validates Pipeline 2's fallback-to-legacy behavior on 
  failure — a reliability mechanism this project has treated as high-priority 
  elsewhere (Phase 5 fallback testing, the settlement/escalation reliability 
  work). Deserves real investigation before being dismissed as cosmetic.
- Actual error output was NOT yet captured/reviewed in detail.

### Next steps when picked up
1. Run both tests fresh, capture full error output verbatim.
2. For #1: confirm whether this predates the cleanup session (check if anything 
   the migration touched — deedService.js, wallet funding logic, test fixtures — 
   could plausibly be the cause) or was already broken.
3. For #2: confirm whether the REAL fallback logic works correctly and only the 
   test's own mocking mechanism is broken, or whether the fallback itself has a 
   genuine problem.
4. Do not treat either as resolved until actual error output has been reviewed.
