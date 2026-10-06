import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/config.js';
import { pool, testDbConnection } from './db/index.js';
import { initMqttClient, closeMqttClient } from './mqtt/mqttClient.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

const app = express();

// 1. Security HTTP Headers
app.use(helmet());

// 2. CORS Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === config.frontendUrl || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// 3. Body Parsing Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. Rate Limiting Middleware
app.use('/api', apiRateLimiter);

// 5. Mount API Routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    project: 'IoT-Based Smart Water Level Monitoring and Management System',
    status: 'ONLINE',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// 6. 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// 7. Start HTTP Server & Initialize MQTT
const server = app.listen(config.port, async () => {
  console.log(`================================================================`);
  console.log(`🚀 Smart Water Monitoring Backend running on port ${config.port}`);
  console.log(`   Mode: ${config.nodeEnv}`);
  console.log(`   Health: http://localhost:${config.port}/api/health`);
  console.log(`   Tank:   http://localhost:${config.port}/api/tank`);
  console.log(`================================================================`);

  // Test Database Connection at startup
  const dbCheck = await testDbConnection();
  if (dbCheck.connected) {
    console.log(`✅ PostgreSQL Connected successfully to [${dbCheck.database}]`);
  } else {
    console.warn(`⚠️ PostgreSQL Connection Warning: ${dbCheck.error}`);
    console.warn(`   Ensure the database 'smart_water_monitoring' is created and running.`);
  }

  // Initialize MQTT Client (Subscriber)
  initMqttClient();
});

// Graceful Shutdown
const handleShutdown = async (signal) => {
  console.log(`\n[${signal}] Initiating graceful shutdown...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await closeMqttClient();
      await pool.end();
      console.log('PostgreSQL pool drained.');
    } catch (err) {
      console.error('Error during shutdown:', err.message);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default app;
