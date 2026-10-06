# System Architecture

## Overview
The **IoT-Based Smart Water Level Monitoring and Management System** is a full-stack IoT solution engineered to monitor and automate water levels for a single prototype tank in real-time.

---

## High-Level Architecture Diagram

```
+-----------------------------------------------------------+
|                      PHYSICAL PROTOTYPE                   |
|                                                           |
|   +-------------------+          +--------------------+   |
|   | HC-SR04 Sensor    |          | 5V Relay Module    |   |
|   | Trig: GPIO 5      |          | IN: GPIO 23        |   |
|   | Echo: GPIO 18 (VD)|          +---------+----------+   |
|   +---------+---------+                    |              |
|             |                              | (Switches)   |
|             v                              v              |
|   +---------+------------------------------+----------+   |
|   |                      ESP32                        |   |
|   |            I2C LCD 16x2 (SDA:21, SCL:22)          |   |
|   +-----------------------+---------------------------+   |
+---------------------------|-------------------------------+
                            | Wi-Fi (MQTT 1883)
                            v
              +----------------------------+
              |     MQTT Broker (Aedex/    |
              |       Mosquitto / EMQX)    |
              +-------------+--------------+
                            |
           Sub: Sensor Data | Pub: Pump Command
                            v
              +----------------------------+
              |   Node.js / Express Server |
              |  - MQTT.js Subscriber/Pub  |
              |  - Validation & Rate Limit |
              |  - PostgreSQL Persistence  |
              |  - Socket.IO Server Engine |
              +-----+----------------+-----+
                    |                |
      (pg Pool / SQL)                | (WebSockets)
                    v                v
      +-------------------+    +--------------------+
      | PostgreSQL 14+    |    | React 18+ Dashboard|
      | - tanks           |    | - Real-time Gauge  |
      | - sensor_readings |    | - Chart.js Trends  |
      | - pump_status     |    | - Pump Manual/Auto |
      | - system_events   |    | - Mobile/Desktop   |
      +-------------------+    +--------------------+
```

---

## Data Flow

### 1. Telemetry Ingestion (Sensor to Dashboard)
1. **HC-SR04** transmits ultrasonic pulses and measures echo pulse duration.
2. **ESP32** computes distance in cm:
   $$\text{distance} = \frac{\text{speed\_of\_sound} \times \text{echo\_time}}{2}$$
   Computes water height and percentage:
   $$\text{waterHeight} = \text{tankHeight} - \text{distance}$$
   $$\text{waterLevelPercent} = \left(\frac{\text{waterHeight}}{\text{tankHeight}}\right) \times 100$$
3. ESP32 updates local 16x2 I2C LCD screen.
4. ESP32 publishes JSON payload to `water/tank1/reading` over MQTT.
5. **Node.js MQTT Subscriber** receives payload, validates schema and clamp bounds.
6. Node.js executes parameterized SQL query storing the reading in PostgreSQL (`sensor_readings`).
7. Node.js evaluates water level alerts (LOW $\le 20\%$, FULL $\ge 80\%$) and pump auto-triggers.
8. Node.js emits `waterReading` and `waterAlert` events via **Socket.IO**.
9. **React Dashboard** receives event via `useSensorData()` custom hook and updates UI & Chart instantaneously.

---

### 2. Pump Control Loop (Dashboard to Actuator)
1. User clicks **"Pump ON"**, **"Pump OFF"**, or **"AUTO"** in React Dashboard.
2. React sends `POST /api/pump/control` with `{ command: "ON", mode: "MANUAL" }`.
3. Node.js validates command and user permission.
4. Node.js publishes command to `water/tank1/pump/command` via MQTT.
5. ESP32 receives command, triggers Relay on **GPIO 23**, and drives external 5V DC pump.
6. ESP32 publishes confirmed state to `water/tank1/pump/status`.
7. Node.js logs state transition in PostgreSQL `pump_status` and broadcasts `pumpStatus` via Socket.IO.
8. Dashboard reflects real-time confirmed pump state.
