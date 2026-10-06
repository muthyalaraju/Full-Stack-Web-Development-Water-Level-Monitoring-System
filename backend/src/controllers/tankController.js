import * as tankService from '../services/tankService.js';

/**
 * GET /api/tank
 * Get metadata for the single prototype tank
 */
export const getTank = async (req, res, next) => {
  try {
    const tank = await tankService.getTankById(1);
    if (!tank) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Tank #1 configuration not found. Please ensure database seed script has run.',
      });
    }

    res.status(200).json({
      success: true,
      data: tank,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tank/readings/latest
 * Get latest ultrasonic reading
 */
export const getLatestReading = async (req, res, next) => {
  try {
    const reading = await tankService.getLatestReading(1);
    if (!reading) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No sensor readings recorded yet. Awaiting ESP32 transmission.',
      });
    }

    res.status(200).json({
      success: true,
      data: reading,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tank/readings/history
 * Get recent chronological sensor readings for chart rendering
 */
export const getReadingHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '30', 10);
    const history = await tankService.getReadingHistory(1, limit);

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tank/readings?from=&to=
 * Filter sensor readings by date range
 */
export const getReadings = async (req, res, next) => {
  try {
    const { from, to, limit } = req.query;
    const parsedLimit = parseInt(limit || '100', 10);
    const readings = await tankService.getReadingsByRange(1, from, to, parsedLimit);

    res.status(200).json({
      success: true,
      count: readings.length,
      data: readings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tank/readings
 * Record a reading (useful for testing or HTTP fallback)
 */
export const createReading = async (req, res, next) => {
  try {
    const { distance_cm, water_height_cm, water_level_percent, water_status } = req.body;

    if (distance_cm === undefined || water_height_cm === undefined || water_level_percent === undefined) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Missing required reading fields: distance_cm, water_height_cm, water_level_percent.',
      });
    }

    const saved = await tankService.saveSensorReading({
      tank_id: 1,
      distance_cm,
      water_height_cm,
      water_level_percent,
      water_status,
    });

    res.status(201).json({
      success: true,
      data: saved,
    });
  } catch (error) {
    next(error);
  }
};
