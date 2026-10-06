import { testDbConnection } from '../db/index.js';

/**
 * GET /api/health
 * Comprehensive service health check
 */
export const getHealth = async (req, res, next) => {
  try {
    const dbStatus = await testDbConnection();

    const isHealthy = dbStatus.connected;
    const statusCode = isHealthy ? 200 : 503;

    res.status(statusCode).json({
      status: isHealthy ? 'UP' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      services: {
        backend: 'ONLINE',
        database: dbStatus.connected ? 'CONNECTED' : 'DISCONNECTED',
        databaseDetails: dbStatus.connected
          ? { database: dbStatus.database, serverTime: dbStatus.time }
          : { error: dbStatus.error },
        mqtt: 'READY (Awaiting client trigger in Phase 4)',
      },
    });
  } catch (error) {
    next(error);
  }
};
