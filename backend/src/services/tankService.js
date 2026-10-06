import { query } from '../db/index.js';
import { calculateWaterStatus } from '../utils/constants.js';

/**
 * Fetch Tank Configuration by ID
 * @param {number} id 
 */
export const getTankById = async (id = 1) => {
  const sql = `
    SELECT id, tank_name, tank_height_cm, tank_capacity_liters, created_at
    FROM tanks
    WHERE id = $1
    LIMIT 1;
  `;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
};

/**
 * Fetch Most Recent Sensor Reading
 * @param {number} tankId 
 */
export const getLatestReading = async (tankId = 1) => {
  const sql = `
    SELECT id, tank_id, distance_cm, water_height_cm, water_level_percent, water_status, created_at
    FROM sensor_readings
    WHERE tank_id = $1
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const result = await query(sql, [tankId]);
  return result.rows[0] || null;
};

/**
 * Fetch Chronological History of Readings (ordered ascending for charts)
 * @param {number} tankId 
 * @param {number} limit 
 */
export const getReadingHistory = async (tankId = 1, limit = 30) => {
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
  return result.rows;
};

/**
 * Fetch Filtered Readings by Date Range
 * @param {number} tankId 
 * @param {string} from 
 * @param {string} to 
 * @param {number} limit 
 */
export const getReadingsByRange = async (tankId = 1, from, to, limit = 100) => {
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
  return result.rows[0];
};
