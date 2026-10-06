import pkg from 'pg';
const { Pool } = pkg;
import { config } from '../config/config.js';

// Detect hosted database vs local PostgreSQL to configure SSL appropriately
const isLocalhost = config.databaseUrl.includes('localhost') || config.databaseUrl.includes('127.0.0.1');
const sslConfig = !isLocalhost || config.databaseUrl.includes('sslmode=require')
  ? { rejectUnauthorized: false }
  : false;

// Initialize PostgreSQL Connection Pool
export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10, // Max concurrent clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: sslConfig,
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

