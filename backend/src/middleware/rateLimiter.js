import rateLimit from 'express-rate-limit';

/**
 * Standard API Rate Limiter
 * 120 requests per minute per IP to prevent spam while supporting 2-3s dashboard polling
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // Limit each IP to 120 requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'TooManyRequests',
    message: 'Rate limit exceeded: Please wait before requesting additional telemetry.',
  },
});

/**
 * Strict Rate Limiter for Control Commands (e.g., Pump triggers)
 * 20 control dispatches per minute per IP to prevent relay chattering
 */
export const controlRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'TooManyRequests',
    message: 'Too many pump control requests dispatched. Please wait a moment.',
  },
});

