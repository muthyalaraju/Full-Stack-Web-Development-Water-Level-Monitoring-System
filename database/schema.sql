-- ====================================================================
-- Database: smart_water_monitoring
-- Project: IoT-Based Smart Water Level Monitoring and Management System
-- PostgreSQL Schema
-- ====================================================================

-- Enable UUID extension if needed in future (optional, using SERIAL for current scope)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tanks Table
CREATE TABLE IF NOT EXISTS tanks (
    id SERIAL PRIMARY KEY,
    tank_name VARCHAR(100) NOT NULL,
    tank_height_cm NUMERIC(6, 2) NOT NULL DEFAULT 20.00 CHECK (tank_height_cm > 0),
    tank_capacity_liters NUMERIC(8, 2) DEFAULT 10.00 CHECK (tank_capacity_liters >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sensor Readings Table (HC-SR04 readings via MQTT/ESP32)
CREATE TABLE IF NOT EXISTS sensor_readings (
    id SERIAL PRIMARY KEY,
    tank_id INT NOT NULL REFERENCES tanks(id) ON DELETE CASCADE,
    distance_cm NUMERIC(6, 2) NOT NULL CHECK (distance_cm >= 0),
    water_height_cm NUMERIC(6, 2) NOT NULL CHECK (water_height_cm >= 0),
    water_level_percent NUMERIC(5, 2) NOT NULL CHECK (water_level_percent >= 0 AND water_level_percent <= 100),
    water_status VARCHAR(20) NOT NULL CHECK (water_status IN ('LOW', 'NORMAL', 'FULL')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for high performance time-series queries
CREATE INDEX IF NOT EXISTS idx_sensor_readings_tank_created_at 
    ON sensor_readings (tank_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_created_at 
    ON sensor_readings (created_at DESC);

-- 3. Pump Status Table (Tracks pump state transitions and control modes)
CREATE TABLE IF NOT EXISTS pump_status (
    id SERIAL PRIMARY KEY,
    tank_id INT NOT NULL REFERENCES tanks(id) ON DELETE CASCADE,
    status VARCHAR(10) NOT NULL CHECK (status IN ('ON', 'OFF')),
    control_mode VARCHAR(10) NOT NULL CHECK (control_mode IN ('AUTO', 'MANUAL')),
    reason VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for retrieving the latest pump status quickly
CREATE INDEX IF NOT EXISTS idx_pump_status_tank_created_at 
    ON pump_status (tank_id, created_at DESC);

-- 4. System Events Table (Alerts, connectivity events, manual overrides)
CREATE TABLE IF NOT EXISTS system_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL', 'ERROR')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for event log pagination and filtering
CREATE INDEX IF NOT EXISTS idx_system_events_created_at 
    ON system_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_severity 
    ON system_events (severity, created_at DESC);

