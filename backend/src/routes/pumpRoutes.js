import { Router } from 'express';
import * as pumpController from '../controllers/pumpController.js';
import { validatePumpControl } from '../middleware/validator.js';
import { controlRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// GET /api/pump/status - Current relay state & mode
router.get('/status', pumpController.getPumpStatus);

// POST /api/pump/control - Dispatch pump command (rate-limited and validated)
router.post('/control', controlRateLimiter, validatePumpControl, pumpController.controlPump);

export default router;
