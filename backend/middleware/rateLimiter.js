const rateLimit = require('express-rate-limit');

/**
 * Global rate limiter for standard endpoints.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});

/**
 * Strict rate limiter for financial endpoints (Topup, Withdraw, Fund).
 * Limits by User ID to prevent NAT throttling.
 */
const walletLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // strictly limit to 5 financial requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // If the user is authenticated, limit by their ID.
    // Otherwise fallback to IP (though these routes should be protected anyway).
    return req.user ? req.user.id : req.ip;
  },
  message: { success: false, message: 'Too many financial transactions attempted. Please try again later.' }
});

module.exports = {
  globalLimiter,
  walletLimiter
};
