import rateLimit from 'express-rate-limit';

// 10 requests per minute per user on verify endpoint
export const verifyRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.userId || req.ip || 'unknown',
  message: { error: 'Too many requests. Please wait a moment before checking more references.' },
  standardHeaders: true,
  legacyHeaders: false,
});
