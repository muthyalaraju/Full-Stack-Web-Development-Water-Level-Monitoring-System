/**
 * DEVELOPMENT-ONLY MOCK DATA
 * Clearly segregated from production telemetry.
 * Used exclusively for UI verification during Phase 1 (Frontend Foundation).
 */

export const MOCK_TANK = {
  id: 1,
  tank_name: 'Prototype Water Tank 1',
  tank_height_cm: 20.0,
  tank_capacity_liters: 10.0,
  created_at: new Date(Date.now() - 3600000).toISOString(),
};

export const MOCK_INITIAL_READING = {
  id: 101,
  tank_id: 1,
  distance_cm: 5.6,
  water_height_cm: 14.4,
  water_level_percent: 72,
  water_status: 'NORMAL',
  created_at: new Date().toISOString(),
};

export const MOCK_INITIAL_PUMP_STATUS = {
  id: 1,
  tank_id: 1,
  status: 'OFF',
  control_mode: 'AUTO',
  reason: 'Normal tank water level (72%)',
  created_at: new Date(Date.now() - 600000).toISOString(),
};

export const MOCK_INITIAL_EVENTS = [
  {
    id: 1,
    event_type: 'SYSTEM_INIT',
    message: 'Smart Water Level Monitoring System initialized.',
    severity: 'INFO',
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 2,
    event_type: 'PUMP_AUTO_OFF',
    message: 'Pump automatically stopped: Tank water level reached normal operating range.',
    severity: 'INFO',
    created_at: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: 3,
    event_type: 'SENSOR_STATUS',
    message: 'HC-SR04 ultrasonic echo timing calibrated successfully.',
    severity: 'INFO',
    created_at: new Date(Date.now() - 300000).toISOString(),
  },
];

// Helper to generate 20 historical readings for initial chart demonstration
export const generateMockHistory = (count = 15) => {
  const readings = [];
  const now = Date.now();
  const interval = 15000; // 15 seconds apart

  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now - i * interval).toISOString();
    // Smooth fluctuation around 68% - 74%
    const percent = Math.round(70 + Math.sin(i * 0.5) * 4);
    const height = Number(((20 * percent) / 100).toFixed(1));
    const distance = Number((20 - height).toFixed(1));

    readings.push({
      id: 100 - i,
      tank_id: 1,
      distance_cm: distance,
      water_height_cm: height,
      water_level_percent: percent,
      water_status: percent <= 20 ? 'LOW' : percent >= 80 ? 'FULL' : 'NORMAL',
      created_at: time,
    });
  }
  return readings;
};
