import { Router } from 'express';
import * as tankController from '../controllers/tankController.js';
import { validateHistoryQuery } from '../middleware/validator.js';

const router = Router();

// GET /api/tank - Tank metadata
router.get('/', tankController.getTank);

// GET /api/tank/readings/latest - Most recent ultrasonic reading
router.get('/readings/latest', tankController.getLatestReading);

// GET /api/tank/readings/history - Chronological history for chart
router.get('/readings/history', validateHistoryQuery, tankController.getReadingHistory);

// GET /api/tank/readings?from=&to= - Date-filtered readings
router.get('/readings', validateHistoryQuery, tankController.getReadings);

// POST /api/tank/readings - Ingest reading (HTTP fallback / test endpoint)
router.post('/readings', tankController.createReading);

export default router;

