const rateLimit = require("express-rate-limit");

// Login rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum 10 login attempts
  message: {
    message: "Too many login attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
};