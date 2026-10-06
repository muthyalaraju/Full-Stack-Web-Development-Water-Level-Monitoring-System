import { PUMP_STATUS, CONTROL_MODE, EVENT_SEVERITY } from '../utils/constants.js';

/**
 * Validates pump control POST payload
 */
export const validatePumpControl = (req, res, next) => {
  const { command, mode } = req.body || {};

  if (!command || !['ON', 'OFF', 'AUTO'].includes(command)) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: "Invalid or missing 'command'. Allowed values: 'ON', 'OFF', 'AUTO'.",
    });
  }

  if (mode && !['AUTO', 'MANUAL'].includes(mode)) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: "Invalid 'mode'. Allowed values: 'AUTO', 'MANUAL'.",
    });
  }

  next();
};

/**
 * Validates event creation POST payload
 */
export const validateCreateEvent = (req, res, next) => {
  const { event_type, message, severity } = req.body || {};

  if (!event_type || typeof event_type !== 'string' || event_type.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: "Field 'event_type' is required and must be a non-empty string.",
    });
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: "Field 'message' is required and must be a non-empty string.",
    });
  }

  if (severity && !Object.values(EVENT_SEVERITY).includes(severity)) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: `Invalid 'severity'. Allowed values: ${Object.values(EVENT_SEVERITY).join(', ')}.`,
    });
  }

  next();
};

/**
 * Validates sensor history query parameters
 */
export const validateHistoryQuery = (req, res, next) => {
  const { limit, from, to } = req.query;

  if (limit) {
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 500) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: "Query parameter 'limit' must be an integer between 1 and 500.",
      });
    }
  }

  if (from && isNaN(Date.parse(from))) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: "Query parameter 'from' must be a valid ISO-8601 date string.",
    });
  }

  if (to && isNaN(Date.parse(to))) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: "Query parameter 'to' must be a valid ISO-8601 date string.",
    });
  }

  next();
};

