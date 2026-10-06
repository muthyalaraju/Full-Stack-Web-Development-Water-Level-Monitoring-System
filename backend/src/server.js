import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/config.js';
import { pool, testDbConnection } from './db/index.js';
import { initMqttClient, closeMqttClient } from './mqtt/mqttClient.js';
import { initSocket } from './socket/socketService.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

const app = express();

// 1. Security HTTP Headers
app.use(helmet());

// Origin validator supporting localhost, Vercel preview domains, and configured FRONTEND_URL
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return true;
  const configured = (config.frontendUrl || '').split(',').map((u) => u.trim().replace(/\/+$/, ''));
  if (configured.includes(origin.replace(/\/+$/, ''))) return true;
  if (origin.endsWith('.vercel.app')) return true;
  return false;
};

// 2. CORS Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Blocked by CORS policy: origin ${origin} not permitted`));
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

// 7. Create HTTP Server & Attach Socket.IO
const httpServer = http.createServer(app);

// Attach Socket.IO directly to existing HTTP server
initSocket(httpServer);

// 8. Start Listening & Initialize MQTT
httpServer.listen(config.port, async () => {
  console.log(`================================================================`);
  console.log(`🚀 Smart Water Monitoring Backend running on port ${config.port}`);
  console.log(`   Mode: ${config.nodeEnv}`);
  console.log(`   Health:    http://localhost:${config.port}/api/health`);
  console.log(`   Tank:      http://localhost:${config.port}/api/tank`);
  console.log(`   Socket.IO: Attached on port ${config.port}`);
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
  httpServer.close(async () => {
    console.log('HTTP and Socket.IO server closed.');
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
