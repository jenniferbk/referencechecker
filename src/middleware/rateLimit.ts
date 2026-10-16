import rateLimit from 'express-rate-limit';

// 60 requests per minute per user on verify endpoint. The client checks up to 4
// references at a time (~15s each), so a normal run stays well under this.
export const verifyRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.userId || req.ip || 'unknown',
  message: { error: 'Too many requests. Please wait a moment before checking more references.' },
  standardHeaders: true,
  legacyHeaders: false,
});
