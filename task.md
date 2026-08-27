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
*Status: Not Started. (A script was run, but due to browser automation failure, no visual verification occurred. The files were cleanly reverted via `git restore` to prevent unverified code from lingering).*
- `NotificationModal.jsx`
- `EditProfileModal.jsx`
- `RevisionModal.jsx`
- `AuthModal.jsx`
- `TermsModal.jsx`
- `ThemeToggle.jsx`
- `DeedCard.jsx`
- `NotificationDropdown.jsx`

**GROUP 2 — Wallet & Transaction Components**
*Status: Not Started.*
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
*Status: Not Started.*
- `DeedDetails.jsx` (See Known Open Items)
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
- **Flash of Wrong Theme:** Confirm whether the flash-of-wrong-theme fix (`index.html` inline script) is still fully functioning and hasn't regressed.
- **Header Contrast:** Confirm the `DashboardHeader` / KYC banner shade fix is still correct in both modes.
- **DeedDetails Outer Wrapper:** `DeedDetails.jsx` was specifically observed to have its outer wrapper still rendering a light gradient during the dispute screenshot check. This must be fixed when addressing Group 3.

### 5. Final Completion Criteria
After all 3 groups are done:
1. Re-run the full occurrence-count audit (using `audit.js` which checks for isolated light classes without `dark:` siblings) and confirm it's at or near zero.
2. Explicitly justify any remainder (e.g., the Wallet Overview gradient card intentionally excluded, or `DisputeComparison.jsx` intentionally dark).
3. Perform a full manual click-through (homepage -> buyer flow -> seller flow -> every sidebar item -> every modal) in dark mode with screenshots as the absolute final definition of "done."
