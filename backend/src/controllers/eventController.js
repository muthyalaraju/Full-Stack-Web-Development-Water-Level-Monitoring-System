import * as eventService from '../services/eventService.js';

/**
 * GET /api/events
 * Get system events and alerts
 */
export const getEvents = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '20', 10);
    const events = await eventService.getRecentEvents(limit);

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/events
 * Create a new audit event or alert
 */
export const createEvent = async (req, res, next) => {
  try {
    const { event_type, message, severity } = req.body;

    const event = await eventService.logEvent({
      event_type,
      message,
      severity,
    });

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
};
