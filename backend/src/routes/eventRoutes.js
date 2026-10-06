import { Router } from 'express';
import * as eventController from '../controllers/eventController.js';
import { validateCreateEvent } from '../middleware/validator.js';

const router = Router();

// GET /api/events - System events & alert logs
router.get('/', eventController.getEvents);

// POST /api/events - Log a system event
router.post('/', validateCreateEvent, eventController.createEvent);

export default router;
