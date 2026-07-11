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
  max: 20, // strictly limit to 20 financial requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // These routes are authenticated, so req.user will always exist
    // Returning req.user.id directly prevents IPv6 validation errors from express-rate-limit
    return req.user.id;
  },
  message: { success: false, message: 'Too many financial transactions attempted. Please try again later.' }
});

module.exports = {
  globalLimiter,
  walletLimiter
};
