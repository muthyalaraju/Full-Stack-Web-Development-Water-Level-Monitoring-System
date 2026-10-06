/**
 * Socket.IO Test Client
 * Verifies real-time event reception from the Express server.
 * 
 * Usage:
 *   node src/utils/testSocketClient.js
 */

import { io } from 'socket.io-client';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

console.log(`Connecting Socket.IO test client to ${SERVER_URL}...`);

const socket = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 3,
});

socket.on('connect', () => {
  console.log(`✅ [Socket.IO Client Connected] Socket ID: ${socket.id}`);
});

socket.on('connected', (data) => {
  console.log('📩 [Server Handshake Confirmed]:', data);
});

socket.on('waterReading', (reading) => {
  console.log('🌊 [Received Event: waterReading]:', reading);
});

socket.on('pumpStatus', (status) => {
  console.log('⚡ [Received Event: pumpStatus]:', status);
});

socket.on('waterAlert', (alert) => {
  console.log('🚨 [Received Event: waterAlert]:', alert);
});

socket.on('disconnect', (reason) => {
  console.log(`❌ [Disconnected]: ${reason}`);
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
  process.exit(1);
});

// Auto-exit test client after 6 seconds if no error
setTimeout(() => {
  console.log('Test client completed 6-second listener window. Closing.');
  socket.close();
  process.exit(0);
}, 6000);

