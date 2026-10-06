import { query } from '../db/index.js';
import { calculateWaterStatus } from '../utils/constants.js';

// In-memory fallback cache to ensure zero data drops if DB is temporarily offline
let inMemoryLatestReading = null;
const inMemoryHistory = [];
const DEFAULT_TANK_1 = {
  id: 1,
  tank_name: 'Tank 1',
  tank_height_cm: 20.0,
  tank_capacity_liters: 10.0,
  created_at: new Date().toISOString(),
};

/**
 * Fetch Tank Configuration by ID
 * @param {number} id 
 */
export const getTankById = async (id = 1) => {
  try {
    const sql = `
      SELECT id, tank_name, tank_height_cm, tank_capacity_liters, created_at
      FROM tanks
      WHERE id = $1
      LIMIT 1;
    `;
    const result = await query(sql, [id]);
    return result.rows[0] || DEFAULT_TANK_1;
  } catch (err) {
    console.warn(`[TankService Fallback] Database query failed for tank #${id}, using fallback spec:`, err.message);
    return id === 1 ? DEFAULT_TANK_1 : null;
  }
};

/**
 * Fetch Most Recent Sensor Reading
 * @param {number} tankId 
 */
export const getLatestReading = async (tankId = 1) => {
  try {
    const sql = `
      SELECT id, tank_id, distance_cm, water_height_cm, water_level_percent, water_status, created_at
      FROM sensor_readings
      WHERE tank_id = $1
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    const result = await query(sql, [tankId]);
    if (result.rows[0]) {
      return result.rows[0];
    }
  } catch (err) {
    console.warn(`[TankService Fallback] Database query failed for latest reading, checking memory cache:`, err.message);
  }
  return inMemoryLatestReading;
};

/**
 * Fetch Chronological History of Readings (ordered ascending for charts)
 * @param {number} tankId 
 * @param {number} limit 
 */
export const getReadingHistory = async (tankId = 1, limit = 30) => {
  try {
    const sql = `
      SELECT * FROM (
        SELECT id, tank_id, distance_cm, water_height_cm, water_level_percent, water_status, created_at
        FROM sensor_readings
        WHERE tank_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      ) sub
      ORDER BY created_at ASC;
    `;
    const result = await query(sql, [tankId, limit]);
    if (result.rows.length > 0) {
      return result.rows;
    }
  } catch (err) {
    console.warn(`[TankService Fallback] Database query failed for reading history, using in-memory buffer:`, err.message);
  }
  return inMemoryHistory.slice(-limit);
};

/**
 * Fetch Filtered Readings by Date Range
 * @param {number} tankId 
 * @param {string} from 
 * @param {string} to 
 * @param {number} limit 
 */
export const getReadingsByRange = async (tankId = 1, from, to, limit = 100) => {
  try {
    let sql = `
      SELECT id, tank_id, distance_cm, water_height_cm, water_level_percent, water_status, created_at
      FROM sensor_readings
      WHERE tank_id = $1
    `;
    const params = [tankId];

    if (from) {
      params.push(from);
      sql += ` AND created_at >= $${params.length}`;
    }

    if (to) {
      params.push(to);
      sql += ` AND created_at <= $${params.length}`;
    }

    params.push(limit);
    sql += ` ORDER BY created_at DESC LIMIT $${params.length};`;

    const result = await query(sql, params);
    return result.rows;
  } catch (err) {
    console.warn(`[TankService Fallback] Database query failed for date range, using in-memory history:`, err.message);
    let filtered = [...inMemoryHistory];
    if (from) filtered = filtered.filter((r) => new Date(r.created_at) >= new Date(from));
    if (to) filtered = filtered.filter((r) => new Date(r.created_at) <= new Date(to));
    return filtered.slice(0, limit);
  }
};

/**
 * Insert New Sensor Reading (used by MQTT receiver and test endpoints)
 */
export const saveSensorReading = async ({
  tank_id = 1,
  distance_cm,
  water_height_cm,
  water_level_percent,
  water_status,
}) => {
  const derivedStatus = water_status || calculateWaterStatus(water_level_percent);

  let record;
  try {
    const sql = `
      INSERT INTO sensor_readings (tank_id, distance_cm, water_height_cm, water_level_percent, water_status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, tank_id, distance_cm, water_height_cm, water_level_percent, water_status, created_at;
    `;
    const params = [
      tank_id,
      distance_cm,
      water_height_cm,
      water_level_percent,
      derivedStatus,
    ];

    const result = await query(sql, params);
    record = result.rows[0];
  } catch (err) {
    console.warn(`[TankService Fallback] Database write failed, saving to in-memory buffer:`, err.message);
    record = {
      id: Date.now(),
      tank_id,
      distance_cm,
      water_height_cm,
      water_level_percent,
      water_status: derivedStatus,
      created_at: new Date().toISOString(),
    };
  }

  inMemoryLatestReading = record;
  inMemoryHistory.push(record);
  if (inMemoryHistory.length > 100) inMemoryHistory.shift();

  return record;
};

