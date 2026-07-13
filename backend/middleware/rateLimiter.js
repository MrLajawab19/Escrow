const rateLimit = require('express-rate-limit');

/**
 * ── Rate Limiters ──────────────────────────────────────────────────────────────
 *
 * Three tiers, applied in different scopes:
 *
 *  1. authLimiter    → Login/signup routes only (brute-force protection)
 *  2. globalLimiter  → All /api/* routes as a baseline ceiling
 *  3. walletLimiter  → Money-moving routes only (topup, withdraw, fund, release, cancel, refund)
 *
 * The Razorpay webhook (/api/wallet/razorpay-webhook) is EXEMPT from all rate
 * limiters — it has its own idempotency protection via WebhookEvent records.
 *
 * When a request hits a route with multiple limiters (e.g. POST /api/auth/buyer/login
 * matches both globalLimiter and authLimiter), express-rate-limit tracks each
 * limiter independently — the most restrictive one wins.
 */

/**
 * AUTH rate limiter — tight limit for login/signup endpoints.
 * Protects against credential stuffing and brute-force attacks.
 *
 * 10 attempts per 15 minutes per IP.
 * After exhaustion, the user must wait for the window to reset.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 login/signup attempts per window
  standardHeaders: true,     // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,      // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
  },
  // Skip successful requests — only count failed attempts toward the limit
  // This prevents a legitimate user from being locked out after 10 successful page loads
  skipSuccessfulRequests: false,
});

/**
 * GLOBAL rate limiter — lenient baseline for all API traffic.
 * Prevents general abuse (scraping, DoS) without impacting normal usage.
 *
 * 100 requests per 15 minutes per IP.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  // CRITICAL: Skip the Razorpay webhook route.
  // Razorpay retries failed webhooks with increasing delays (5s, 30s, 5m, 30m, 1h, 6h).
  // Rate-limiting these could cause legitimate payment events to be permanently dropped.
  // The webhook has its own idempotency protection (WebhookEvent records) so it doesn't
  // need rate limiting for abuse prevention.
  skip: (req) => {
    // req.originalUrl includes the /api prefix, whereas req.path strips it based on app.use mounting.
    return req.originalUrl === '/api/wallet/razorpay-webhook' || req.originalUrl === '/api/wallet/razorpay-webhook/';
  },
});

/**
 * WALLET rate limiter — strict limit for money-moving endpoints.
 * Keyed by authenticated User ID (not IP) to prevent NAT/shared-IP throttling.
 *
 * 20 financial requests per 15 minutes per user.
 *
 * Applied to: POST /api/wallet/top-up, /withdraw
 *             POST /api/deeds/:id/fund, /release, /cancel, /reject, /refund
 *
 * NOT touched by this Phase 10 work — carried forward from Phase 5 hardening.
 */
const walletLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 financial requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // These routes are authenticated, so req.user will always exist
    // Returning req.user.id directly prevents IPv6 validation errors from express-rate-limit
    return req.user.id;
  },
  message: {
    success: false,
    message: 'Too many financial transactions attempted. Please try again later.',
  },
});

module.exports = {
  authLimiter,
  globalLimiter,
  walletLimiter,
};
