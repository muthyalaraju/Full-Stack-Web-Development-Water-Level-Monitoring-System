# Database Setup Guide - PostgreSQL

This directory contains the database definition and initialization scripts for the **IoT-Based Smart Water Level Monitoring and Management System**.

## Database Overview
- **Engine**: PostgreSQL 14+ (Tested on PostgreSQL 18.6)
- **Database Name**: `smart_water_monitoring`

### Tables
1. **`tanks`**: Stores tank hardware dimensions (height, capacity) for calibration.
2. **`sensor_readings`**: High-frequency time-series measurements received from the ESP32 (distance, water height, percentage, status).
3. **`pump_status`**: State machine transitions for the 5V DC pump relay (ON/OFF, AUTO/MANUAL, reason).
4. **`system_events`**: Audit and alert log (LOW/FULL water warnings, pump failures, connection status changes).

---

## Initialization Instructions

### 1. Create the Database
Open PostgreSQL command line (`psql`) or pgAdmin:

```bash
# Log in to PostgreSQL CLI
psql -U postgres
```

Inside the PostgreSQL terminal:
```sql
CREATE DATABASE smart_water_monitoring;
\q
```

### 2. Execute Schema & Seed
Run the scripts directly from terminal / PowerShell:

```powershell
# Run Schema creation
psql -U postgres -d smart_water_monitoring -f ./database/schema.sql

# Run Seed script (Initial Tank 1 configuration)
psql -U postgres -d smart_water_monitoring -f ./database/seed.sql
```

Alternatively, inside `psql`:
```sql
\c smart_water_monitoring
\i database/schema.sql
\i database/seed.sql
```

---

## Verification
Verify the tables were created:
```sql
\dt
```
Expected output:
- `tanks`
- `sensor_readings`
- `pump_status`
- `system_events`

Verify Tank 1 configuration:
```sql
SELECT * FROM tanks WHERE id = 1;
```
