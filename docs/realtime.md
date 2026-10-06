# Real-Time Telemetry & Socket.IO Architecture

## Pipeline Overview

The real-time data architecture forms a unified stream bridging physical microcontroller telemetry to the React client dashboard:

```
  +-------------+
  |    ESP32    |
  |  (HC-SR04)  |
  +------+------+
         | (1) MQTT Publish: water/tank1/reading (JSON)
         v
  +-------------+
  | MQTT Broker |
  | (Port 1883) |
  +------+------+
         | (2) MQTT Receive
         v
  +-------------------------------------------------------------+
  |                   Node.js / Express Backend                 |
  |  - mqttClient: Subscribes & receives telemetry               |
  |  - messageHandler: Validates, clamps, verifies tankId=1     |
  |  - PostgreSQL: Stores record in `sensor_readings`           |
  |  - socketService: Filters duplicates & rate limits          |
  +------------------------------+------------------------------+
                                 | (3) Socket.IO Emit: 'waterReading'
                                 v
                  +------------------------------+
                  |       React Dashboard        |
                  |     - useSensorData() hook   |
                  |     - Real-Time Tank Gauge   |
                  |     - Chart.js Trend Window  |
                  +------------------------------+
```

---

## Socket.IO Events Reference

### 1. `waterReading`
- **Direction**: Server $\rightarrow$ Client
- **Trigger**: Emitted whenever a valid sensor reading is received from MQTT and stored in PostgreSQL.
- **Payload Schema**:
  ```json
  {
    "id": 142,
    "tank_id": 1,
    "distance_cm": 5.60,
    "water_height_cm": 14.40,
    "water_level_percent": 72,
    "water_status": "NORMAL",
    "created_at": "2026-10-06T18:15:30.000Z"
  }
  ```

---

### 2. `pumpStatus`
- **Direction**: Server $\rightarrow$ Client
- **Trigger**: Emitted when:
  1. ESP32 publishes relay feedback to `water/tank1/pump/status`
  2. Automatic closed-loop logic triggers pump ON/OFF
  3. Dashboard user dispatches manual command via `POST /api/pump/control`
- **Payload Schema**:
  ```json
  {
    "id": 18,
    "tank_id": 1,
    "status": "ON",
    "control_mode": "MANUAL",
    "reason": "Manual control command (ON) applied",
    "created_at": "2026-10-06T18:15:35.000Z"
  }
  ```

---

### 3. `waterAlert`
- **Direction**: Server $\rightarrow$ Client
- **Trigger**: Emitted when water enters critical threshold zones ($\le 20\%$ LOW or $\ge 80\%$ FULL).
- **Payload Schema**:
  ```json
  {
    "event_type": "WATER_LOW_ALERT",
    "message": "Tank water level reached 18% (<= 20% LOW threshold).",
    "severity": "CRITICAL"
  }
  ```

---

### 4. `connected`
- **Direction**: Server $\rightarrow$ Client
- **Trigger**: Emitted upon successful handshake connection.
- **Payload Schema**:
  ```json
  {
    "message": "Connected to Smart Water Level Monitoring Real-Time Stream",
    "timestamp": "2026-10-06T18:15:00.000Z",
    "socketId": "xY89aQ..."
  }
  ```

---

## Rate Limiting & Backpressure Protection

To safeguard both the Express HTTP server and browser UI from rendering freezes or memory leaks:

1. **Minimum Sampling Interval (`MIN_READING_INTERVAL_MS = 500ms`)**:
   - Even if the hardware or MQTT broker sends bursts of rapid messages, the Socket.IO broadcast enforces a minimum 500ms spacing between client broadcasts.
2. **Duplicate Suppression**:
   - If consecutive readings have identical `distance_cm`, `water_level_percent`, and `water_status` within a 2.5-second window, duplicate Socket.IO broadcast is dropped, conserving network bandwidth and browser repaint cycles.
3. **Database Guardrails**:
   - Every reading undergoes integer and float validation before SQL parameterized insertion, preventing malformed telemetry from flooding PostgreSQL.
