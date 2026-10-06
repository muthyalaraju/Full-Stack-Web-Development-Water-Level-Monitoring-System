# MQTT Topics & Payload Specification

## Broker Details
- **Default Port**: 1883 (TCP) / 8883 (TLS)
- **Quality of Service (QoS)**: QoS 1 (At least once delivery)
- **Retain Flag**:
  - `water/tank1/reading`: False (real-time stream)
  - `water/tank1/pump/status`: True (retained for quick state recovery)
  - `water/tank1/system/status`: True (LWT / Online status)

---

## Topic Hierarchy

### 1. `water/tank1/reading` (Sensor Telemetry)
- **Direction**: ESP32 $\rightarrow$ MQTT Broker $\rightarrow$ Node.js Backend
- **Publish Interval**: Every 2 to 3 seconds
- **Payload Schema (JSON)**:
  ```json
  {
    "tankId": 1,
    "distanceCm": 5.6,
    "waterHeightCm": 14.4,
    "waterLevelPercent": 72.0,
    "waterStatus": "NORMAL",
    "timestamp": "2026-10-06T17:35:00.000Z"
  }
  ```

---

### 2. `water/tank1/pump/command` (Pump Control Commands)
- **Direction**: Node.js Backend $\rightarrow$ MQTT Broker $\rightarrow$ ESP32
- **Payload Schema (JSON)**:
  ```json
  {
    "command": "ON",
    "mode": "MANUAL"
  }
  ```
  or
  ```json
  {
    "command": "OFF",
    "mode": "MANUAL"
  }
  ```
  or
  ```json
  {
    "command": "AUTO",
    "mode": "AUTO"
  }
  ```

---

### 3. `water/tank1/pump/status` (Pump Feedback & State)
- **Direction**: ESP32 $\rightarrow$ MQTT Broker $\rightarrow$ Node.js Backend
- **Payload Schema (JSON)**:
  ```json
  {
    "tankId": 1,
    "status": "ON",
    "controlMode": "MANUAL",
    "reason": "Manual dashboard command received",
    "timestamp": "2026-10-06T17:35:05.000Z"
  }
  ```

---

### 4. `water/tank1/system/status` (LWT & Heartbeat)
- **Direction**: ESP32 $\rightarrow$ MQTT Broker $\rightarrow$ Node.js Backend
- **Last Will and Testament (LWT)** configured on ESP32:
  - If ESP32 unexpectedly disconnects, broker publishes:
    ```json
    { "status": "OFFLINE", "reason": "Connection lost unexpectedly" }
    ```
  - When ESP32 connects normally:
    ```json
    { "status": "ONLINE", "ip": "192.168.1.105", "rssi": -65 }
    ```
