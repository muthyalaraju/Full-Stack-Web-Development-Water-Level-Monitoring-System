export const WATER_STATUS = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  FULL: 'FULL',
};

export const PUMP_STATUS = {
  ON: 'ON',
  OFF: 'OFF',
};

export const CONTROL_MODE = {
  AUTO: 'AUTO',
  MANUAL: 'MANUAL',
};

export const EVENT_SEVERITY = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  ERROR: 'ERROR',
};

export const calculateWaterStatus = (percent) => {
  if (percent <= 20) return WATER_STATUS.LOW;
  if (percent >= 80) return WATER_STATUS.FULL;
  return WATER_STATUS.NORMAL;
};

