import { query } from '../db/index.js';
import { EVENT_SEVERITY } from '../utils/constants.js';

/**
 * Fetch Recent System Events & Alerts
 * @param {number} limit 
 */
export const getRecentEvents = async (limit = 20) => {
  const sql = `
    SELECT id, event_type, message, severity, created_at
    FROM system_events
    ORDER BY created_at DESC
    LIMIT $1;
  `;
  const result = await query(sql, [limit]);
  return result.rows;
};

/**
 * Insert a System Event / Warning Record
 */
export const logEvent = async ({
  event_type,
  message,
  severity = EVENT_SEVERITY.INFO,
}) => {
  const sql = `
    INSERT INTO system_events (event_type, message, severity)
    VALUES ($1, $2, $3)
    RETURNING id, event_type, message, severity, created_at;
  `;
  const result = await query(sql, [event_type, message, severity]);
  return result.rows[0];
};
