import { config } from '../config/config.js';

/**
 * 404 Route Not Found Handler
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Resource not found at ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Centralized Application Error Middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error(`[Unhandled Error] ${req.method} ${req.url}:`, err);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    success: false,
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected server error occurred.',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};

