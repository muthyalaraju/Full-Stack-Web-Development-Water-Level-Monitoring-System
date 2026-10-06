import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import tankRoutes from './tankRoutes.js';
import pumpRoutes from './pumpRoutes.js';
import eventRoutes from './eventRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/tank', tankRoutes);
router.use('/pump', pumpRoutes);
router.use('/events', eventRoutes);

export default router;
