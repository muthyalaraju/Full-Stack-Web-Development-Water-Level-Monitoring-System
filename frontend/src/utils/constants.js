/**
 * System-wide Thresholds and Configuration Constants
 * Configurable parameters for Tank 1 prototype
 */

export const TANK_CONFIG = {
  DEFAULT_HEIGHT_CM: 20.0,
  DEFAULT_CAPACITY_LITERS: 10.0,
  // Water Level Thresholds (%)
  THRESHOLDS: {
    LOW: 20,    // 0 - 20%: LOW
    FULL: 80,   // 81 - 100%: FULL
  },
};

export const WATER_STATUS = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  FULL: 'FULL',
};

export const PUMP_STATE = {
  ON: 'ON',
  OFF: 'OFF',
};

export const CONTROL_MODE = {
  AUTO: 'AUTO',
  MANUAL: 'MANUAL',
};

export const CONNECTION_STATUS = {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  ERROR: 'ERROR',
};

export const ALERT_SEVERITY = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  ERROR: 'ERROR',
};

/**
 * Derives status ('LOW' | 'NORMAL' | 'FULL') from water level percentage
 * @param {number} percent 
 * @returns {string}
 */
export const calculateWaterStatus = (percent) => {
  if (percent <= TANK_CONFIG.THRESHOLDS.LOW) return WATER_STATUS.LOW;
  if (percent >= TANK_CONFIG.THRESHOLDS.FULL) return WATER_STATUS.FULL;
  return WATER_STATUS.NORMAL;
};

