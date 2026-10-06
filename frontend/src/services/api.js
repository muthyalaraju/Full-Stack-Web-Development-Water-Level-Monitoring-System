/**
 * API Service Layer for Smart Water Level Monitoring System
 * Handles all REST API communications with the Node.js/Express backend.
 * Provides fallback to development mock state when backend is not connected.
 */

import {
  MOCK_TANK,
  MOCK_INITIAL_READING,
  MOCK_INITIAL_PUMP_STATUS,
  MOCK_INITIAL_EVENTS,
  generateMockHistory,
} from './mockData';

// Set to true during Phase 1 (Frontend Foundation without backend)
const USE_DEV_MOCK = true;
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Fetch Tank Metadata
 */
export const fetchTankInfo = async () => {
  if (USE_DEV_MOCK) {
    return Promise.resolve({ ...MOCK_TANK });
  }

  const response = await fetch(`${API_BASE_URL}/tank`);
  if (!response.ok) throw new Error(`HTTP Error ${response.status}: Failed to fetch tank`);
  return response.json();
};

/**
 * Fetch Latest Sensor Reading
 */
export const fetchLatestReading = async () => {
  if (USE_DEV_MOCK) {
    return Promise.resolve({ ...MOCK_INITIAL_READING });
  }

  const response = await fetch(`${API_BASE_URL}/tank/readings/latest`);
  if (!response.ok) throw new Error(`HTTP Error ${response.status}: Failed to fetch latest reading`);
  return response.json();
};

/**
 * Fetch Sensor Reading History (for charts & logs)
 * @param {number} limit 
 */
export const fetchReadingHistory = async (limit = 30) => {
  if (USE_DEV_MOCK) {
    return Promise.resolve(generateMockHistory(limit));
  }

  const response = await fetch(`${API_BASE_URL}/tank/readings/history?limit=${limit}`);
  if (!response.ok) throw new Error(`HTTP Error ${response.status}: Failed to fetch history`);
  return response.json();
};

/**
 * Fetch Active Pump Status
 */
export const fetchPumpStatus = async () => {
  if (USE_DEV_MOCK) {
    return Promise.resolve({ ...MOCK_INITIAL_PUMP_STATUS });
  }

  const response = await fetch(`${API_BASE_URL}/pump/status`);
  if (!response.ok) throw new Error(`HTTP Error ${response.status}: Failed to fetch pump status`);
  return response.json();
};

/**
 * Send Pump Control Command
 * @param {'ON' | 'OFF' | 'AUTO'} command 
 * @param {'MANUAL' | 'AUTO'} mode 
 */
export const postPumpControl = async (command, mode = 'MANUAL') => {
  if (USE_DEV_MOCK) {
    return Promise.resolve({
      success: true,
      message: `[DEV MOCK] Pump command '${command}' set to mode '${mode}'.`,
      status: {
        tank_id: 1,
        status: command === 'AUTO' ? 'OFF' : command,
        control_mode: mode,
        reason: `Manual control command dispatched (${command})`,
        created_at: new Date().toISOString(),
      },
    });
  }

  const response = await fetch(`${API_BASE_URL}/pump/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, mode }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: Failed to control pump`);
  }

  return response.json();
};

/**
 * Fetch System Audit & Warning Events
 * @param {number} limit 
 */
export const fetchSystemEvents = async (limit = 20) => {
  if (USE_DEV_MOCK) {
    return Promise.resolve([...MOCK_INITIAL_EVENTS]);
  }

  const response = await fetch(`${API_BASE_URL}/events?limit=${limit}`);
  if (!response.ok) throw new Error(`HTTP Error ${response.status}: Failed to fetch events`);
  return response.json();
};

/**
 * System Health Check
 */
export const fetchSystemHealth = async () => {
  if (USE_DEV_MOCK) {
    return Promise.resolve({
      status: 'UP (DEV MOCK)',
      services: {
        database: 'CONNECTED',
        mqtt: 'CONNECTED',
        sensor: 'CONNECTED',
        backend: 'ONLINE',
      },
      timestamp: new Date().toISOString(),
    });
  }

  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error(`HTTP Error ${response.status}: Failed to fetch health`);
  return response.json();
};
