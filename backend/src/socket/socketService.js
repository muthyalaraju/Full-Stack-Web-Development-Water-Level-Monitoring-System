import { Server } from 'socket.io';
import { config } from '../config/config.js';
import {
  registerReadingListener,
  registerPumpListener,
  registerAlertListener,
} from '../mqtt/messageHandler.js';

let io = null;

// Throttling and duplicate emission tracking
let lastEmittedReading = null;
let lastReadingEmitTime = 0;
const MIN_READING_INTERVAL_MS = 500; // Minimum interval between readings to prevent flood

let lastEmittedPump = null;

/**
 * Initialize Socket.IO server attached to the HTTP server
 * @param {import('http').Server} httpServer 
 */
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return true;
  const configured = (config.frontendUrl || '').split(',').map((u) => u.trim().replace(/\/+$/, ''));
  if (configured.includes(origin.replace(/\/+$/, ''))) return true;
  if (origin.endsWith('.vercel.app')) return true;
  return false;
};

export const initSocket = (httpServer) => {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Blocked by Socket.IO CORS policy: origin ${origin} not permitted`));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    const clientCount = io.engine.clientsCount;
    console.log(`🔌 [Socket.IO Connected] Client ID: ${socket.id} (Active Clients: ${clientCount})`);

    // Greet and confirm connection
    socket.emit('connected', {
      message: 'Connected to Smart Water Level Monitoring Real-Time Stream',
      timestamp: new Date().toISOString(),
      socketId: socket.id,
    });

    socket.on('disconnect', (reason) => {
      const remainingCount = io.engine.clientsCount;
      console.log(`🔌 [Socket.IO Disconnected] Client ID: ${socket.id} Reason: ${reason} (Remaining: ${remainingCount})`);
    });

    socket.on('error', (err) => {
      console.error(`[Socket.IO Client Error] ID: ${socket.id}:`, err.message);
    });
  });

  // Hook into MQTT Message Handler
  registerReadingListener(broadcastWaterReading);
  registerPumpListener(broadcastPumpStatus);
  registerAlertListener(broadcastWaterAlert);

  console.log('⚡ [Socket.IO Initialized] Real-time event bridge active.');
  return io;
};

/**
 * Broadcast validated sensor reading to all connected dashboard clients
 * Applies rate limiting and duplicate suppression
 * @param {object} reading 
 */
export const broadcastWaterReading = (reading) => {
  if (!io) return;

  const now = Date.now();

  // Rate Limiting: Minimum 500ms interval
  if (now - lastReadingEmitTime < MIN_READING_INTERVAL_MS) {
    return;
  }

  // Duplicate Suppression: Check if data is identical to previous emission within 2.5s
  if (
    lastEmittedReading &&
    now - lastReadingEmitTime < 2500 &&
    lastEmittedReading.distance_cm === reading.distance_cm &&
    lastEmittedReading.water_level_percent === reading.water_level_percent &&
    lastEmittedReading.water_status === reading.water_status
  ) {
    return;
  }

  lastEmittedReading = reading;
  lastReadingEmitTime = now;

  io.emit('waterReading', reading);
};

/**
 * Broadcast pump status change to all connected dashboard clients
 * @param {object} pumpStatus 
 */
export const broadcastPumpStatus = (pumpStatus) => {
  if (!io) return;

  // Suppress immediate duplicates
  if (
    lastEmittedPump &&
    lastEmittedPump.status === pumpStatus.status &&
    lastEmittedPump.control_mode === pumpStatus.control_mode
  ) {
    return;
  }

  lastEmittedPump = pumpStatus;
  console.log(`⚡ [Socket.IO Broadcast] pumpStatus -> ${pumpStatus.status} (${pumpStatus.control_mode})`);
  io.emit('pumpStatus', pumpStatus);
};

/**
 * Broadcast critical water alert or warning event
 * @param {object} alert 
 */
export const broadcastWaterAlert = (alert) => {
  if (!io) return;

  console.log(`⚡ [Socket.IO Broadcast] waterAlert -> [${alert.event_type}]: ${alert.message}`);
  io.emit('waterAlert', alert);
};

/**
 * Get active client count
 */
export const getActiveClientCount = () => {
  return io ? io.engine.clientsCount : 0;
};

