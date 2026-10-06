-- ====================================================================
-- Initial Seed Script for smart_water_monitoring
-- Initializes Tank 1 and base operational records
-- Note: Does NOT inject fake sensor readings, preserving genuine IoT telemetry
-- ====================================================================

-- 1. Insert Initial Prototype Tank (Tank ID: 1)
INSERT INTO tanks (id, tank_name, tank_height_cm, tank_capacity_liters)
VALUES (1, 'Prototype Water Tank 1', 20.00, 10.00)
ON CONFLICT (id) DO UPDATE 
SET tank_name = EXCLUDED.tank_name,
    tank_height_cm = EXCLUDED.tank_height_cm,
    tank_capacity_liters = EXCLUDED.tank_capacity_liters;

-- Ensure sequence matches the manual ID insertion
SELECT setval('tanks_id_seq', (SELECT MAX(id) FROM tanks));

-- 2. Insert Baseline Pump State
INSERT INTO pump_status (tank_id, status, control_mode, reason)
VALUES (1, 'OFF', 'AUTO', 'Initial system startup configuration');

-- 3. Insert Initial System Event
INSERT INTO system_events (event_type, message, severity)
VALUES 
    ('SYSTEM_INIT', 'Smart Water Level Monitoring System database initialized successfully.', 'INFO');
