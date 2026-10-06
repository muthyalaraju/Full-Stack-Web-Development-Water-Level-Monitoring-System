import { testDbConnection } from '../db/index.js';
import { getMqttStatus } from '../mqtt/mqttClient.js';

/**
 * GET /api/health
 * Comprehensive service health check reporting Express, PostgreSQL, and MQTT status
 */
export const getHealth = async (req, res, next) => {
  try {
    const dbStatus = await testDbConnection();
    const mqttStatus = getMqttStatus();

    const isHealthy = dbStatus.connected && mqttStatus.status === 'CONNECTED';
    const statusCode = dbStatus.connected ? 200 : 503;

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
        mqtt: mqttStatus.status,
        mqttDetails: {
          brokerUrl: mqttStatus.brokerUrl,
          lastConnected: mqttStatus.lastConnected,
          lastError: mqttStatus.lastError,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
