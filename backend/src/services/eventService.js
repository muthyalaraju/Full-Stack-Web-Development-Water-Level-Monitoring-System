import { query } from '../db/index.js';
import { EVENT_SEVERITY } from '../utils/constants.js';

const inMemoryEvents = [];

/**
 * Fetch Recent System Events & Alerts
 * @param {number} limit 
 */
export const getRecentEvents = async (limit = 20) => {
  try {
    const sql = `
      SELECT id, event_type, message, severity, created_at
      FROM system_events
      ORDER BY created_at DESC
      LIMIT $1;
    `;
    const result = await query(sql, [limit]);
    if (result.rows.length > 0) {
      return result.rows;
    }
  } catch (err) {
    console.warn(`[EventService Fallback] Database query failed for events, using memory cache:`, err.message);
  }
  return inMemoryEvents.slice(0, limit);
};

/**
 * Insert a System Event / Warning Record
 */
export const logEvent = async ({
  event_type,
  message,
  severity = EVENT_SEVERITY.INFO,
}) => {
  let record;
  try {
    const sql = `
      INSERT INTO system_events (event_type, message, severity)
      VALUES ($1, $2, $3)
      RETURNING id, event_type, message, severity, created_at;
    `;
    const result = await query(sql, [event_type, message, severity]);
    record = result.rows[0];
  } catch (err) {
    console.warn(`[EventService Fallback] Database write failed for event, saving to memory:`, err.message);
    record = {
      id: Date.now(),
      event_type,
      message,
      severity,
      created_at: new Date().toISOString(),
    };
  }

  inMemoryEvents.unshift(record);
  if (inMemoryEvents.length > 50) inMemoryEvents.pop();

  return record;
};

