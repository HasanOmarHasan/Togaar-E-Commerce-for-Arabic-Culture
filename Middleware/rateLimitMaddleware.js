const rateLimit = require("express-rate-limit");


const limiters = {
  // Strict limiter (1 request per minute)
  strict: rateLimit({
    windowMs: 1 * 60 * 1000,
    max: process.env.NODE_ENV === "dev" ? 15 : 2,
    message: {
      error: "Too many requests. Please wait 1 minute.",
      success: false,
      code: "STRICT_RATE_LIMIT",
    },
    standardHeaders: true,
  }),

  // Normal limiter (100 requests per minute)
  normal: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: {
      error: "Too many requests. Please try again later.",
      success: false,
      code: "NORMAL_RATE_LIMIT",
    },
    standardHeaders: true,
  }),

  // Auth limiter (5 attempts per 15 minutes)
  auth: rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: {
      error: "Too many authentication attempts.",
      success: false,
      code: "AUTH_RATE_LIMIT",
    },
    standardHeaders: true,
  }),
};

module.exports = limiters;
