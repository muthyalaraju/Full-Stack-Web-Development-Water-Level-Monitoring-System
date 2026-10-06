# PostgreSQL Database Architecture & Guide

This directory contains the database definition and initialization scripts for the **IoT-Based Smart Water Level Monitoring and Management System**.

## 1. Database Specifications
- **Engine**: PostgreSQL (Tested with PostgreSQL 14+ and 18.x)
- **Database Name**: `smart_water_monitoring`
- **Scope**: Strictly monitors **ONE** prototype tank (Tank 1). Multi-tank monitoring is intentionally not implemented.

---

## 2. Entity-Relationship & Table Architecture

```
                   +-----------------------------------+
                   |              tanks                |
                   +-----------------------------------+
                   | PK  id: SERIAL                    |
                   |     tank_name: VARCHAR(100)       |
                   |     tank_height_cm: NUMERIC(6,2)  |
                   |     tank_capacity_liters: NUMERIC |
                   |     created_at: TIMESTAMPTZ       |
                   +-----------------+-----------------+
                                     |
             +-----------------------+-----------------------+
             | (1 : N)                                       | (1 : N)
             v                                               v
+-------------------------------+              +-------------------------------+
|       sensor_readings         |              |          pump_status          |
+-------------------------------+              +-------------------------------+
| PK  id: SERIAL                |              | PK  id: SERIAL                |
| FK  tank_id: INT (CASCADE)    |              | FK  tank_id: INT (CASCADE)    |
|     distance_cm: NUMERIC(6,2) |              |     status: VARCHAR(10)       |
|     water_height_cm: NUMERIC  |              |     control_mode: VARCHAR(10) |
|     water_level_percent: NUM  |              |     reason: VARCHAR(255)      |
|     water_status: VARCHAR(20) |              |     created_at: TIMESTAMPTZ   |
|     created_at: TIMESTAMPTZ   |              +-------------------------------+
+-------------------------------+
 [INDEX on (tank_id, created_at DESC)]
 [INDEX on (created_at DESC)]

                   +-----------------------------------+
                   |           system_events           |
                   +-----------------------------------+
                   | PK  id: SERIAL                    |
                   |     event_type: VARCHAR(50)       |
                   |     message: TEXT                 |
                   |     severity: VARCHAR(20)         |
                   |     created_at: TIMESTAMPTZ       |
                   +-----------------------------------+
```

### Table Relationships
1. **`tanks` (Parent)**:
   - Holds calibration parameters for the prototype container (Tank Height: 20 cm, Capacity: 10 Liters).
2. **`sensor_readings` (Child)**:
   - Foreign Key: `tank_id REFERENCES tanks(id) ON DELETE CASCADE`.
   - Stores time-series ultrasonic readings.
   - Enforces `water_status IN ('LOW', 'NORMAL', 'FULL')` and clamped `water_level_percent` between $0$ and $100$.
   - **Composite Index**: `(tank_id, created_at DESC)` ensures $O(\log N)$ retrieval for rolling trend charts and REST API endpoints.
3. **`pump_status` (Child)**:
   - Foreign Key: `tank_id REFERENCES tanks(id) ON DELETE CASCADE`.
   - Records every state transition of the 5V DC pump relay (`status IN ('ON', 'OFF')`) and operational mode (`control_mode IN ('AUTO', 'MANUAL')`).
4. **`system_events` (System-wide Audit Log)**:
   - Logs alerts (`CRITICAL`, `WARNING`, `INFO`), threshold crossings, and manual override events.

---

## 3. How to Create the Database Locally

Open **PowerShell** or **Command Prompt**:

### Step 3.1: Connect and Create the Database
```powershell
# Log in to PostgreSQL server (you will be prompted for your postgres password)
psql -U postgres -c "CREATE DATABASE smart_water_monitoring;"
```

*If you prefer using the interactive `psql` shell:*
```sql
psql -U postgres
CREATE DATABASE smart_water_monitoring;
\q
```

---

## 4. How to Execute schema.sql

Run the following command from the project root directory:

```powershell
psql -U postgres -d smart_water_monitoring -f ./database/schema.sql
```

This creates:
- Table `tanks`
- Table `sensor_readings` + Indexes
- Table `pump_status` + Indexes
- Table `system_events` + Indexes

---

## 5. How to Execute seed.sql

Run the seed command to insert the single prototype tank (Tank 1):

```powershell
psql -U postgres -d smart_water_monitoring -f ./database/seed.sql
```

This inserts:
1. **Tank 1**:
   - `id`: `1`
   - `tank_name`: `'Prototype Water Tank 1'`
   - `tank_height_cm`: `20.00`
   - `tank_capacity_liters`: `10.00`
2. **Initial Pump Status**:
   - `tank_id`: `1`
   - `status`: `'OFF'`
   - `control_mode`: `'AUTO'`
   - `reason`: `'Initial system startup configuration'`
3. **Initial Event**:
   - `event_type`: `'SYSTEM_INIT'`
   - `message`: `'Smart Water Level Monitoring System database initialized successfully.'`
   - `severity`: `'INFO'`

*(Note: Does **not** insert mock sensor readings, preserving genuine IoT telemetry).*

---

## 6. How to Verify the Database Setup

Run these SQL queries to verify table creation and initial seed data:

```powershell
psql -U postgres -d smart_water_monitoring -c "\dt"
```
**Expected Output:**
```text
               List of relations
 Schema |      Name       | Type  |  Owner   
--------+-----------------+-------+----------
 public | pump_status     | table | postgres
 public | sensor_readings | table | postgres
 public | system_events   | table | postgres
 public | tanks           | table | postgres
(4 rows)
```

Verify Tank 1:
```powershell
psql -U postgres -d smart_water_monitoring -c "SELECT * FROM tanks;"
```

Verify Initial Pump State:
```powershell
psql -U postgres -d smart_water_monitoring -c "SELECT * FROM pump_status;"
```
