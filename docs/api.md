# REST API Specification

Base URL: `http://localhost:5000/api`

---

## Endpoints

### 1. Health Check
- **Endpoint**: `GET /api/health`
- **Description**: Returns operational status of Express backend, PostgreSQL connection, and MQTT broker connectivity.
- **Response** (`200 OK`):
  ```json
  {
    "status": "UP",
    "timestamp": "2026-10-06T17:35:00.000Z",
    "services": {
      "database": "CONNECTED",
      "mqtt": "CONNECTED",
      "uptimeSeconds": 342.12
    }
  }
  ```

---

### 2. Tank Details
- **Endpoint**: `GET /api/tank`
- **Description**: Returns configuration and dimension metadata for the single monitored tank (Tank 1).
- **Response** (`200 OK`):
  ```json
  {
    "id": 1,
    "tank_name": "Prototype Water Tank 1",
    "tank_height_cm": 20.0,
    "tank_capacity_liters": 10.0,
    "created_at": "2026-10-06T17:00:00.000Z"
  }
  ```

---

### 3. Latest Sensor Reading
- **Endpoint**: `GET /api/tank/readings/latest`
- **Description**: Returns the most recent HC-SR04 ultrasonic measurement stored in PostgreSQL.
- **Response** (`200 OK`):
  ```json
  {
    "id": 142,
    "tank_id": 1,
    "distance_cm": 5.6,
    "water_height_cm": 14.4,
    "water_level_percent": 72.0,
    "water_status": "NORMAL",
    "created_at": "2026-10-06T17:35:10.000Z"
  }
  ```

---

### 4. Reading History (Default Rolling Window)
- **Endpoint**: `GET /api/tank/readings/history?limit=50`
- **Description**: Returns recent $N$ historical readings ordered chronologically for rendering trend charts.
- **Response** (`200 OK`):
  ```json
  [
    {
      "id": 141,
      "tank_id": 1,
      "distance_cm": 5.8,
      "water_height_cm": 14.2,
      "water_level_percent": 71.0,
      "water_status": "NORMAL",
      "created_at": "2026-10-06T17:35:00.000Z"
    }
  ]
  ```

---

### 5. Filtered Reading History by Date Range
- **Endpoint**: `GET /api/tank/readings?from=ISO_STRING&to=ISO_STRING&limit=100`
- **Description**: Returns sensor records within an explicit timestamp range.

---

### 6. Pump Status
- **Endpoint**: `GET /api/pump/status`
- **Description**: Returns the active relay state, control mode (AUTO/MANUAL), and last switch reason.
- **Response** (`200 OK`):
  ```json
  {
    "id": 12,
    "tank_id": 1,
    "status": "OFF",
    "control_mode": "AUTO",
    "reason": "Water level reached 82% (FULL threshold)",
    "created_at": "2026-10-06T17:32:00.000Z"
  }
  ```

---

### 7. Pump Control
- **Endpoint**: `POST /api/pump/control`
- **Description**: Dispatches a command to switch relay states or toggle AUTO mode.
- **Request Body**:
  ```json
  {
    "command": "ON",
    "mode": "MANUAL"
  }
  ```
  *(Allowed values for `command`: `"ON"`, `"OFF"`, `"AUTO"`; for `mode`: `"MANUAL"`, `"AUTO"`)*
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Pump command dispatched to MQTT broker",
    "payload": {
      "command": "ON",
      "mode": "MANUAL",
      "timestamp": "2026-10-06T17:35:20.000Z"
    }
  }
  ```

---

### 8. System Events & Alerts
- **Endpoint**: `GET /api/events?limit=20`
- **Description**: Returns logged alerts and lifecycle messages.
- **Endpoint**: `POST /api/events`
- **Description**: Record a manual event or alert.
