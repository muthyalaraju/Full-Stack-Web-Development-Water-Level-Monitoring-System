# IoT-Based Smart Water Level Monitoring and Management System

[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B%20%7C%20v22%2B-339933?logo=node.js)](https://nodejs.org)
[![PostgreSQL Version](https://img.shields.io/badge/PostgreSQL-14%2B%20%7C%2018-4169E1?logo=postgresql)](https://www.postgresql.org)
[![React Version](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev)
[![MQTT Protocol](https://img.shields.io/badge/MQTT-3.1.1%20QoS%201-660066?logo=mqtt)](https://mqtt.org)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socket.io)](https://socket.io)
[![License](https://img.shields.io/badge/Academic-Capstone%20Project-blue)](#)

A production-grade, end-to-end Full Stack IoT system engineered to monitor and manage liquid levels in real-time for a calibrated prototype tank. Integrates an **ESP32 microcontroller**, **HC-SR04 ultrasonic sensor**, an isolated **5V relay actuator**, a public/private **MQTT broker**, a high-performance **Node.js/Express backend**, a relational **PostgreSQL database**, and a modern **React 19 + Tailwind CSS** dashboard with WebSockets.

---

## 1. Project Overview

Water resource mismanagement, tank overflow, and dry-run pump damage cause significant electrical and water waste in residential, commercial, and agricultural sectors. 

This project solves this problem through an automated closed-loop IoT cyber-physical architecture:
- **Telemetry Ingestion**: An ultrasonic sensor measures liquid level non-invasively and transmits measurements via MQTT.
- **Relational Auditing**: The backend validates, sanitizes, and persists readings and relay transitions in PostgreSQL.
- **Real-Time Visualization**: Socket.IO streams instantaneous telemetry to a React dashboard without browser polling or page refreshes.
- **Automated & Manual Actuation**: The system implements automated hysteresis control (triggers pump ON when level $\le 20\%$ and OFF when $\ge 80\%$) and manual user overrides via MQTT commands.
- **Fail-Safe Operation**: The dashboard displays *confirmed physical relay feedback* from hardware rather than optimistic assumptions.

---

## 2. Features

- **Real-Time Telemetry Streaming**: Sub-second ultrasonic updates via MQTT and Socket.IO.
- **Dual Visual Level Indicators**: Interactive switcher between a graduated **Vertical Tank Column** (with surface waves, ruler markings, and sensor head) and an accessible SVG **Circular Radial Gauge**.
- **Automated Closed-Loop Pump Control**: Threshold-based hysteresis ($\le 20\%$ refilling trigger, $\ge 80\%$ overflow cutoff, and $21\% - 79\%$ deadband to prevent rapid cycling).
- **Manual User Overrides**: Responsive dashboard controls (`TURN ON`, `TURN OFF`, `AUTO`) protected against conflicting duplicate commands.
- **Hardware Status Confirmation**: UI updates only after the physical relay switch is confirmed by firmware via MQTT.
- **Time-Series Historical Analytics**: Chart.js trend visualization supporting rolling Live windows and PostgreSQL historical range queries (Last 1 Hour, Last 6 Hours, Last 24 Hours) with Min/Max/Avg statistics.
- **System Health Diagnostics**: 4-pillar connectivity monitoring (HC-SR04 Sensor, MQTT Broker, Express Server, PostgreSQL DB) with distinct `CONNECTED` and `DISCONNECTED` states.
- **Fault-Tolerant In-Memory Fallbacks**: Telemetry ingestion and WebSocket streaming operate uninterrupted even during temporary database restarts or network partitions.
- **Virtual Hardware Simulator**: Built-in script simulating ultrasonic acoustics, fluid dynamics, and relay reactions for software-only presentations.
- **Academic Capstone Alignment**: Built in adherence to engineering curriculum criteria (Relational modeling, Security headers, Rate limiting, Responsive UI, and Hardware logic level protection).

---

## 3. Technology Stack

| Layer | Technologies & Frameworks | Role / Purpose |
| :--- | :--- | :--- |
| **Microcontroller Firmware** | C++ (Arduino Framework), `WiFi.h`, `PubSubClient`, `LiquidCrystal_I2C` | Non-blocking sensor polling, MQTT pub/sub, relay switching, 16x2 LCD display. |
| **Sensing & Hardware** | HC-SR04 Ultrasonic Sensor, 5V 1-Channel Relay, 5V DC Pump, Resistor Divider (1kΩ / 2kΩ) | Acoustic time-of-flight measurement, isolated external power switching. |
| **Message Broker** | MQTT 3.1.1 (EMQX Public Broker / Eclipse Mosquitto) | Low-overhead pub/sub transport (`water/tank1/#`). |
| **Backend API Server** | Node.js (v20+), Express.js, `pg` (PostgreSQL client), `mqtt.js`, `socket.io` | Telemetry validation, relational database storage, REST API, WebSocket bridge. |
| **Security & Middleware** | Helmet, CORS, `express-rate-limit`, `express-validator` | HTTP header protection, rate throttling, parameterized SQL injection defense. |
| **Database** | PostgreSQL 14+ / 18+ | Relational schemas, composite B-Tree indexes, foreign keys, timestamps. |
| **Frontend Web Dashboard** | React 19, Vite, Tailwind CSS, Chart.js, `react-chartjs-2`, `lucide-react`, `socket.io-client` | Responsive, accessible, high-contrast dashboard with live gauges and charts. |

---

## 4. Architecture

```
[HC-SR04 Sensor] (Trig GPIO 5, Echo GPIO 18 via 3.3V Divider)
       │
       ▼
[ESP32 Microcontroller] <── (Relay GPIO 23) ──> [5V DC Pump (External Supply)]
       │
       ▼ (Wi-Fi / MQTT: water/tank1/reading)
[EMQX MQTT Broker] (Port 1883)
       │
       ▼ (MQTT Subscriber)
[Node.js / Express Server] ◄──► [PostgreSQL: smart_water_monitoring]
       │
       ▼ (Socket.IO: waterReading, pumpStatus, waterAlert)
[React 19 Dashboard]
       │
       ▼ (REST API: POST /api/pump/control)
[Confirmed Relay Feedback Loop via MQTT]
```

---

## 5. Folder Structure

```
Water Level Monitoring Full Stack Web Development Project/
├── backend/
│   ├── .env.example                     # Environment template
│   ├── package.json                     # Backend dependencies & npm scripts
│   └── src/
│       ├── server.js                    # Server entry point & Socket.IO attachment
│       ├── config/                      # Environment configuration
│       ├── controllers/                 # REST route handlers (Tank, Pump, Events, Health)
│       ├── db/                          # PostgreSQL connection pool (pg.Pool)
│       ├── middleware/                  # Error handling, rate limiting, validation
│       ├── mqtt/                        # MQTT client subscriber, publisher, message handler
│       ├── routes/                      # Express route declarations
│       ├── services/                    # Database services with in-memory resilient buffers
│       ├── socket/                      # Socket.IO emitter service with throttling
│       └── utils/
│           ├── constants.js             # Shared enums and thresholds
│           ├── hardwareSimulator.js     # Virtual ESP32 prototype simulator
│           ├── runEndToEndVerification.js # Automated 8-scenario integration test suite
│           ├── testMqttPublish.js       # Standalone MQTT telemetry test publisher
│           ├── testPumpFlow.js          # Standalone pump hysteresis test script
│           └── testSocketClient.js      # Headless Socket.IO test client
├── frontend/
│   ├── index.html                       # HTML5 entry template
│   ├── package.json                     # Frontend dependencies & npm scripts
│   ├── vite.config.js                   # Vite bundler configuration
│   ├── tailwind.config.js               # Tailwind CSS theme configuration
│   └── src/
│       ├── App.jsx                      # App root component
│       ├── main.jsx                     # React DOM entry
│       ├── components/                  # Modular React components:
│       │   ├── Navbar.jsx               # Header with stream status & connection pills
│       │   ├── Dashboard.jsx            # Master responsive dashboard container
│       │   ├── WaterLevelCard.jsx       # Water status card with gauge switcher
│       │   ├── WaterLevelGauge.jsx      # Vertical liquid column indicator (20cm scale)
│       │   ├── CircularGauge.jsx        # SVG radial circular progress gauge
│       │   ├── TankStatusCard.jsx       # Prototype geometry & estimated volume
│       │   ├── PumpStatusCard.jsx       # Confirmed relay status (ON / OFF)
│       │   ├── PumpControl.jsx          # Manual / Auto control console
│       │   ├── WaterLevelChart.jsx      # Real-time & historical Chart.js trends
│       │   ├── SensorDetails.jsx        # Pin mapping & acoustic time-of-flight math
│       │   ├── AlertPanel.jsx           # Dynamic alerts & audited event logs
│       │   ├── ConnectionStatus.jsx     # 4-Pillar network link status
│       │   ├── SystemHealth.jsx         # Diagnostic integrity & course outcomes
│       │   ├── RecentReadings.jsx       # Tabular view of recent measurements
│       │   └── Footer.jsx               # Academic credits & safety disclaimer
│       ├── hooks/
│       │   └── useSensorData.js         # Unified custom telemetry hook
│       ├── services/
│       │   ├── api.js                   # Fetch REST API client
│       │   └── socket.js                # Socket.IO singleton connection
│       └── utils/
│           └── constants.js             # Frontend thresholds and states
├── database/
│   ├── schema.sql                       # PostgreSQL DDL table definitions & indexes
│   ├── seed.sql                         # Tank 1 configuration baseline & initial state
│   └── README.md                        # Database documentation
├── esp32/
│   ├── water_monitor.ino                # Production Arduino C++ firmware
│   └── README.md                        # Pinout schematic, voltage divider, flashing guide
└── docs/
    ├── architecture.md                  # Comprehensive system architecture document
    ├── api.md                           # Complete REST API specification
    ├── mqtt.md                          # MQTT topic hierarchy & JSON schemas
    ├── database.md                      # Relational ER diagram & indexing guide
    ├── hardware-connections.md          # Wiring schematics & resistor divider details
    ├── testing.md                       # Verification matrix & test execution guide
    ├── deployment.md                    # Production runbook & PM2/Nginx config
    ├── realtime.md                      # Socket.IO WebSocket protocol document
    └── demonstration-guide.md           # College capstone presentation & viva defense Q&A
```

---

## 6. Hardware Requirements

- **ESP32 Microcontroller**: ESP-WROOM-32 Dev Module.
- **Ultrasonic Sensor**: HC-SR04 (5V power, 40 kHz, 2cm to 400cm range).
- **Relay Module**: 5V 1-Channel Relay with Optocoupler isolation (Trigger voltage: 3.3V / 5V).
- **Actuator**: 5V DC Submersible Water Pump (Flow rate: ~80-120 L/h).
- **Display**: 16x2 Character LCD with PCF8574 I2C Backpack interface.
- **Resistors (Voltage Divider)**:
  - $R_1$: $1.0\text{ k}\Omega$ (or $1.8\text{ k}\Omega$)
  - $R_2$: $2.0\text{ k}\Omega$ (or $3.3\text{ k}\Omega$)
- **External Power Supply**: Regulated 5V 2A DC Power Adapter (Powers relay coil and DC pump).
- **Prototyping Tank**: Single bench container with calibrated height $H = 20.0\text{ cm}$.

---

## 7. Software Requirements

- **Operating System**: Windows 10/11, macOS, or Linux (Ubuntu 22.04 LTS).
- **Node.js**: `v20.18.x` or `v22.x+ LTS` (includes `npm`).
- **PostgreSQL**: `v14.x`, `v16.x`, or `v18.x`.
- **Arduino IDE**: `v2.3+` with ESP32 Board Package by Espressif (`v2.0.x` or `v3.0.x`).
- **Required Arduino Libraries**:
  - `PubSubClient` by Nick O'Leary
  - `LiquidCrystal_I2C` by Frank de Brabander
  - `WiFi` (built-in ESP32 core)

---

## 8. Installation

Clone or download the repository to your local workspace:
```bash
git clone <repository-url>
cd "Water Level Monitoring Full Stack Web Development Project"
```

Install backend dependencies:
```bash
cd backend
npm install
```

Install frontend dependencies:
```bash
cd ../frontend
npm install
```

---

## 9. Environment Variables

Create a `.env` file in the `backend/` directory based on [backend/.env.example](file:///c:/Users/muthy/OneDrive/Desktop/Water%20Level%20Monitoring%20Full%20Stack%20Web%20Development%20Project/backend/.env.example):

```ini
# Server Configuration
PORT=5000
NODE_ENV=development

# PostgreSQL Connection URL
# Replace 'your_password' with your local PostgreSQL password:
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/smart_water_monitoring

# MQTT Broker Configuration
MQTT_BROKER_URL=mqtt://broker.emqx.io:1883
MQTT_USERNAME=
MQTT_PASSWORD=

# Frontend Origin for CORS Security
FRONTEND_URL=http://localhost:5173
```

> [!NOTE]
> If PostgreSQL credentials are being configured, the backend automatically utilizes in-memory fallback buffers to prevent dropped readings or crashes during demonstrations.

---

## 10. Database Setup

1. Start your local PostgreSQL service.
2. Create the target database using `psql`:
   ```sql
   CREATE DATABASE smart_water_monitoring;
   ```
3. Execute the schema script:
   ```bash
   psql -U postgres -d smart_water_monitoring -f database/schema.sql
   ```
4. Execute the baseline seed script:
   ```bash
   psql -U postgres -d smart_water_monitoring -f database/seed.sql
   ```
5. Verify the tables:
   ```sql
   \c smart_water_monitoring
   \dt
   SELECT * FROM tanks;
   ```

---

## 11. MQTT Setup

The system is pre-configured to use the public EMQX MQTT broker:
```
Broker URL: mqtt://broker.emqx.io:1883
Port:       1883 (TCP)
```

No broker installation is required for quick prototyping. If you prefer a local broker:
1. Install Eclipse Mosquitto on your machine.
2. Start the service on port 1883.
3. Update `MQTT_BROKER_URL=mqtt://localhost:1883` in `backend/.env`.

---

## 12. Backend Setup

Start the backend in development mode:
```bash
cd backend
npm run dev
# or for production:
npm start
```

Upon successful startup, the terminal logs:
```
⚡ [Socket.IO Initialized] Real-time event bridge active.
🚀 Smart Water Monitoring Backend running on port 5000
✅ [MQTT Connected] Broker: mqtt://broker.emqx.io:1883
📡 [MQTT Subscribed] Topics: water/tank1/reading, water/tank1/pump/status, water/tank1/system/status
```

---

## 13. Frontend Setup

Start the Vite development server:
```bash
cd frontend
npm run dev
```

Open your browser at:
```
http://localhost:5173
```

To verify the production build:
```bash
npm run build
```

---

## 14. ESP32 Setup & Firmware Flashing

1. Connect the ESP32 to your PC via a Micro-USB data cable.
2. Open `esp32/water_monitor.ino` in Arduino IDE.
3. Configure your Wi-Fi credentials at the top of the file:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
4. Select board: **Tools $\rightarrow$ Board $\rightarrow$ ESP32 Arduino $\rightarrow$ ESP32 Dev Module**.
5. Select the appropriate COM Port: **Tools $\rightarrow$ Port $\rightarrow$ COMx**.
6. Wire the circuit strictly following [docs/hardware-connections.md](file:///c:/Users/muthy/OneDrive/Desktop/Water%20Level%20Monitoring%20Full%20Stack%20Web%20Development%20Project/docs/hardware-connections.md):
   - **HC-SR04 TRIG**: `GPIO 5`
   - **HC-SR04 ECHO**: Pass through $1\text{k}\Omega / 2\text{k}\Omega$ voltage divider $\rightarrow$ `GPIO 18`
   - **Relay IN**: `GPIO 23`
   - **LCD SDA / SCL**: `GPIO 21` / `GPIO 22`
7. Click **Upload**. Open Serial Monitor at **115200 baud** to observe Wi-Fi and MQTT connection logs.

---

## 15. Running the Complete Project

Follow this sequence for live presentations or evaluation:

```
Terminal 1 (Backend):      cd backend && npm start
Terminal 2 (Frontend):     cd frontend && npm run dev
Terminal 3 (Simulator*):   cd backend && node src/utils/hardwareSimulator.js
```
*\*Omit Terminal 3 if physical ESP32 hardware is powered on.*

Open `http://localhost:5173` to interact with the live dashboard!

---

## 16. API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Comprehensive health check (Express, DB, MQTT, Socket.IO). |
| `GET` | `/api/tank` | Calibrated metadata for Tank 1 (Height, Capacity, Created timestamp). |
| `GET` | `/api/tank/readings/latest` | Most recent ultrasonic reading in database. |
| `GET` | `/api/tank/readings/history?limit=30` | Chronological reading history for chart rendering. |
| `GET` | `/api/tank/readings?from=&to=&limit=100` | Filter historical sensor telemetry across a date range. |
| `GET` | `/api/pump/status` | Current confirmed physical relay state, control mode, and reason. |
| `POST` | `/api/pump/control` | Dispatch pump control command (`ON`, `OFF`, `AUTO`). |
| `GET` | `/api/events?limit=20` | Audit trail of logged system warnings and alerts. |
| `POST` | `/api/events` | Record a system alert or audit message. |

*Full API response schemas documented in [docs/api.md](file:///c:/Users/muthy/OneDrive/Desktop/Water%20Level%20Monitoring%20Full%20Stack%20Web%20Development%20Project/docs/api.md).*

---

## 17. MQTT Topics & Schemas

| Topic | Publisher | Subscriber | QoS | Payload Summary |
| :--- | :--- | :--- | :---: | :--- |
| `water/tank1/reading` | ESP32 | Backend Server | 1 | `{"tankId":1,"distanceCm":5.6,"waterHeightCm":14.4,"waterLevelPercent":72,"waterStatus":"NORMAL"}` |
| `water/tank1/pump/command` | Backend Server | ESP32 | 1 | `{"command":"ON","mode":"MANUAL","reason":"User manual override"}` |
| `water/tank1/pump/status` | ESP32 | Backend Server | 1 (Retained) | `{"tankId":1,"status":"ON","controlMode":"AUTO","reason":"Water level at 16%"}` |
| `water/tank1/system/status` | ESP32 | Backend Server | 1 (Retained) | `{"status":"ONLINE","ip":"192.168.1.105","rssi":-62}` (or `OFFLINE` on LWT) |

*Full JSON specifications documented in [docs/mqtt.md](file:///c:/Users/muthy/OneDrive/Desktop/Water%20Level%20Monitoring%20Full%20Stack%20Web%20Development%20Project/docs/mqtt.md).*

---

## 18. Troubleshooting Guide

| Issue / Symptom | Probable Cause | Corrective Action |
| :--- | :--- | :--- |
| **Backend reports DB Auth Error** | PostgreSQL password in `.env` does not match local installation. | Update `DATABASE_URL` in `backend/.env`. Note: Backend automatically runs in resilient in-memory mode so the dashboard stays live. |
| **Chart shows "No Telemetry In This Window"** | Neither physical ESP32 nor simulator is running. | Start `node backend/src/utils/hardwareSimulator.js` or power the ESP32. |
| **ESP32 boots in brownout loop** | Pump is drawing power from ESP32 3.3V or VIN pins. | **IMMEDIATELY DISCONNECT.** Power the pump strictly from an external 5V power adapter. Never power inductive loads from MCU pins. |
| **Echo distance reads 0 cm or 20 cm continuously** | Echo pin connected directly without common ground or loose divider. | Verify that ESP32 GND and sensor GND are tied together. Check the 1kΩ / 2kΩ divider. |
| **LCD display shows black boxes or no text** | Incorrect I2C address or contrast potentiometer unadjusted. | Adjust the blue potentiometer on the back of the I2C backpack using a small screwdriver. Verify I2C address is `0x27` or `0x3F`. |
| **Socket.IO shows "DISCONNECTED" on dashboard** | Port 5000 is blocked or backend is not started. | Ensure `backend` is running on port 5000 and `FRONTEND_URL` in `backend/.env` matches `http://localhost:5173`. |
| **Pump control button says "Duplicate" or 409** | Command requested is already the active confirmed state. | Normal behavior: Conflict prevention middleware protects hardware from redundant relay cycling. |

---

## Academic Presentation & Viva Guide

For college evaluation and viva presentation questions, refer to:
- [docs/demonstration-guide.md](file:///c:/Users/muthy/OneDrive/Desktop/Water%20Level%20Monitoring%20Full%20Stack%20Web%20Development%20Project/docs/demonstration-guide.md)
- [docs/testing.md](file:///c:/Users/muthy/OneDrive/Desktop/Water%20Level%20Monitoring%20Full%20Stack%20Web%20Development%20Project/docs/testing.md)
- [docs/architecture.md](file:///c:/Users/muthy/OneDrive/Desktop/Water%20Level%20Monitoring%20Full%20Stack%20Web%20Development%20Project/docs/architecture.md)

