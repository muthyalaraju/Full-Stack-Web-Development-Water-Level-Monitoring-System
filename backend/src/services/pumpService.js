import { query } from '../db/index.js';
import { PUMP_STATUS, CONTROL_MODE } from '../utils/constants.js';

// In-memory fallback pump state to ensure uninterrupted operation
let inMemoryLatestPump = {
  id: 1,
  tank_id: 1,
  status: PUMP_STATUS.OFF,
  control_mode: CONTROL_MODE.AUTO,
  reason: 'System initialization standby',
  created_at: new Date().toISOString(),
};

/**
 * Fetch Most Recent Pump Status Record
 * @param {number} tankId 
 */
export const getLatestPumpStatus = async (tankId = 1) => {
  try {
    const sql = `
      SELECT id, tank_id, status, control_mode, reason, created_at
      FROM pump_status
      WHERE tank_id = $1
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    const result = await query(sql, [tankId]);
    if (result.rows[0]) {
      return result.rows[0];
    }
  } catch (err) {
    console.warn(`[PumpService Fallback] Database query failed for pump status, using memory cache:`, err.message);
  }
  return inMemoryLatestPump;
};

/**
 * Record a Pump State Change in the Database
 */
export const savePumpStatus = async ({
  tank_id = 1,
  status,
  control_mode,
  reason,
}) => {
  let record;
  try {
    const sql = `
      INSERT INTO pump_status (tank_id, status, control_mode, reason)
      VALUES ($1, $2, $3, $4)
      RETURNING id, tank_id, status, control_mode, reason, created_at;
    `;
    const result = await query(sql, [tank_id, status, control_mode, reason]);
    record = result.rows[0];
  } catch (err) {
    console.warn(`[PumpService Fallback] Database write failed for pump status, updating memory cache:`, err.message);
    record = {
      id: Date.now(),
      tank_id,
      status,
      control_mode,
      reason,
      created_at: new Date().toISOString(),
    };
  }

  inMemoryLatestPump = record;
  return record;
};

/**
 * Process a Pump Command from REST API
 * In Phase 3, updates the PostgreSQL record and prepares for MQTT dispatch in Phase 4
 */
export const processPumpControlCommand = async (tankId = 1, command, mode = 'MANUAL') => {
  const current = await getLatestPumpStatus(tankId);

  let newStatus = current ? current.status : 'OFF';
  let reason = '';

  if (command === 'AUTO') {
    mode = 'AUTO';
    reason = 'Switched to autonomous closed-loop control mode';
  } else if (command === 'ON') {
    newStatus = 'ON';
    mode = 'MANUAL';
    reason = 'Manual user override: Pump turned ON';
  } else if (command === 'OFF') {
    newStatus = 'OFF';
    mode = 'MANUAL';
    reason = 'Manual user override: Pump turned OFF';
  }

  const updatedRecord = await savePumpStatus({
    tank_id: tankId,
    status: newStatus,
    control_mode: mode,
    reason,
  });

  return {
    command,
    mode,
    status: updatedRecord,
  };
};

