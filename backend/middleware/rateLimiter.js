const rateLimit = require("express-rate-limit");

//  Auth Limiter 
// Strict - prevents brute force attacks on login/register
// 10 requests per 5 minutes per IP
exports.authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true, // sends RateLimit-* headers in response
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again after 5 minutes.",
  },
});

//  News Limiter 
// Moderate - protects News API quota and prevents scraping
// 100 requests per 15 minutes per IP
exports.newsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many news requests. Please slow down.",
  },
});

//  General Limiter 
// Fallback for any other routes
// 200 requests per 15 minutes per IP
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});
