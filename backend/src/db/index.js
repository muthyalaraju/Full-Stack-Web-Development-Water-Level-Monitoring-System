import pkg from 'pg';
const { Pool } = pkg;
import { config } from '../config/config.js';

// Initialize PostgreSQL Connection Pool
export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10, // Max concurrent clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]: Unexpected client error', err.message);
});

/**
 * Execute a parameterized SQL query
 * @param {string} text - SQL statement with $1, $2 parameters
 * @param {Array} params - Parameter values
 */
export const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (config.nodeEnv === 'development' && duration > 100) {
      console.log(`[SQL Slow Query] (${duration}ms): ${text}`);
    }
    return res;
  } catch (error) {
    console.error(`[SQL Execution Error]: ${error.message} \nQuery: ${text}`);
    throw error;
  }
};

/**
 * Test connectivity to PostgreSQL database
 */
export const testDbConnection = async () => {
  try {
    const res = await query('SELECT NOW() as current_time, current_database() as db_name;');
    return {
      connected: true,
      time: res.rows[0].current_time,
      database: res.rows[0].db_name,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
    };
  }
};
