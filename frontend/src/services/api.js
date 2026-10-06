/**
 * API Service Layer for Smart Water Level Monitoring System
 * Handles all REST API communications with the Node.js/Express backend.
 * Connected directly to production backend (no mock dependence).
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Fetch Tank Metadata
 */
export const fetchTankInfo = async () => {
  const response = await fetch(`${API_BASE_URL}/tank`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Failed to fetch tank configuration`);
  }
  const result = await response.json();
  return result.data || null;
};

/**
 * Fetch Latest Sensor Reading
 */
export const fetchLatestReading = async () => {
  const response = await fetch(`${API_BASE_URL}/tank/readings/latest`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Failed to fetch latest reading`);
  }
  const result = await response.json();
  return result.data || null;
};

/**
 * Fetch Sensor Reading History (for charts & tables)
 * @param {number} limit 
 */
export const fetchReadingHistory = async (limit = 30) => {
  const response = await fetch(`${API_BASE_URL}/tank/readings/history?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Failed to fetch reading history`);
  }
  const result = await response.json();
  return result.data || [];
};

/**
 * Fetch Active Pump Status
 */
export const fetchPumpStatus = async () => {
  const response = await fetch(`${API_BASE_URL}/pump/status`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Failed to fetch pump status`);
  }
  const result = await response.json();
  return result.data || null;
};

/**
 * Send Pump Control Command (ON, OFF, AUTO)
 * @param {'ON' | 'OFF' | 'AUTO'} command 
 * @param {'MANUAL' | 'AUTO'} mode 
 */
export const postPumpControl = async (command, mode = 'MANUAL') => {
  const response = await fetch(`${API_BASE_URL}/pump/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, mode }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: Failed to execute pump control`);
  }

  const result = await response.json();
  return result;
};

/**
 * Fetch System Audit & Alert Events
 * @param {number} limit 
 */
export const fetchSystemEvents = async (limit = 20) => {
  const response = await fetch(`${API_BASE_URL}/events?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Failed to fetch system events`);
  }
  const result = await response.json();
  return result.data || [];
};

/**
 * Fetch Service Health Probe
 */
export const fetchSystemHealth = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok && response.status !== 503) {
    throw new Error(`HTTP ${response.status}: Health check failed`);
  }
  return response.json();
};
