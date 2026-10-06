/**
 * Socket.IO Client Service
 * Manages WebSocket connection to the Express backend for real-time telemetry streaming.
 */

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

/**
 * Initializes and returns the singleton Socket.IO connection
 */
export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
  }

  return socket;
};

/**
 * Disconnects the socket client
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Get current socket instance
 */
export const getSocket = () => socket;
