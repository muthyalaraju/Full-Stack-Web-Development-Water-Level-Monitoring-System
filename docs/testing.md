# Testing & Quality Assurance Verification Guide

This document outlines the testing strategy, automated test suites, and manual verification procedures for the **IoT-Based Smart Water Level Monitoring and Management System**.

---

## 1. Automated Test Suites

### 1.1 End-to-End System Integration Suite
The primary automated verification script is located at:
`backend/src/utils/runEndToEndVerification.js`

This script launches an automated testing client that establishes simultaneous MQTT and Socket.IO connections, executing all **8 critical integration scenarios** against the backend:

```powershell
cd "backend"
node src/utils/runEndToEndVerification.js
```

#### Test Matrix:
| Test ID | Test Scenario | Verification Criteria | Expected Result |
| :--- | :--- | :--- | :--- |
| **TEST 1** | **Telemetry Pipeline** | Publishes synthetic 64% reading to `water/tank1/reading`. Validates Socket.IO `waterReading` broadcast and REST `/api/tank/readings/latest`. | Received within 500ms, accurate percentage (64%), status `NORMAL`. |
| **TEST 2** | **Low Water Level Trigger** | Publishes 16% reading (below $\le 20\%$ threshold). Verifies `WATER_LOW_ALERT` broadcast and auto-trigger of pump `ON`. | Critical alert generated, confirmed pump state `ON` broadcast. |
| **TEST 3** | **Full Tank Trigger** | Publishes 83% reading (above $\ge 80\%$ threshold). Verifies auto-trigger of pump `OFF` with hysteresis. | Full tank alert generated, confirmed pump state `OFF` broadcast. |
| **TEST 4** | **Manual Control & Conflict** | Dispatches `ON`, duplicate `ON` (checks 409 conflict prevention), `OFF`, and restores `AUTO` mode. | Duplicate commands rejected with conflict check; confirmed state emitted. |
| **TEST 5** | **Health & Connectivity** | Probes `GET /api/health` for Express, PostgreSQL, MQTT broker, and Socket.IO statuses. | HTTP 200 OK, services reported `ONLINE`, broker `CONNECTED`. |
| **TEST 6** | **Middleware Guardrails** | Sends invalid query `GET /api/tank/readings/history?limit=1000`. | HTTP 400 Bad Request returned by express-validator. |
| **TEST 7** | **Historical DB Persistence** | Queries `GET /api/tank/readings/history?limit=10` and `GET /api/tank`. | Structured time-series JSON array and calibrated Tank 1 specs returned. |
| **TEST 8** | **ESP32 Lifecycle & LWT** | Publishes online heartbeat to `water/tank1/system/status` and queries `/api/events`. | Audit log persists lifecycle events with timestamps. |

**Result**: **18 / 18 Assertions Passed (0 Failures)**.

---

### 1.2 Dedicated Module Test Scripts

#### A. MQTT Telemetry Test
Publishes test ultrasonic telemetry packets to EMQX broker:
```powershell
cd "backend"
node src/utils/testMqttPublish.js
```

#### B. Socket.IO Client Test
Connects a headless Socket.IO client to verify real-time event streaming:
```powershell
cd "backend"
node src/utils/testSocketClient.js
```

#### C. Closed-Loop Pump Hysteresis Flow Test
Validates pump state transitions, deadband hysteresis logic, and conflict checks:
```powershell
cd "backend"
node src/utils/testPumpFlow.js
```

---

## 2. Virtual Hardware Prototype Simulation

To perform live demonstrations or test the system without physical hardware:
```powershell
cd "backend"
node src/utils/hardwareSimulator.js
```
The simulator:
1. Emulates HC-SR04 acoustics and tank physics (calibrated 20cm height).
2. Publishes telemetry packets every 3000ms to `water/tank1/reading`.
3. Listens to pump commands on `water/tank1/pump/command`.
4. Simulates fluid dynamics: refills when pump is ON, drains when pump is OFF.
5. Emulates relay transitions and sends confirmation to `water/tank1/pump/status`.

---

## 3. Frontend Quality Assurance

### 3.1 Static Linting
Run `oxlint` to detect unused imports and syntax inconsistencies:
```powershell
cd "frontend"
npm run lint
```
*Expected*: Zero syntax or variable errors.

### 3.2 Production Bundle Compilation
Validate that Vite compiles clean, optimized production bundles:
```powershell
cd "frontend"
npm run build
```
*Output*:
```
✓ 1948 modules transformed.
dist/index.html                   0.73 kB
dist/assets/index-CYExjW61.css   31.38 kB
dist/assets/index-BnAdLk41.js   513.02 kB
✓ built in ~2.6s
```

### 3.3 Visual & Accessibility (a11y) Testing
- **Contrast**: Text elements meet WCAG AA standards (high-contrast text on dark `slate-950`/`slate-900` backgrounds).
- **Accessible Names**: All buttons include explicit `aria-label` tags.
- **Screen Reader Support**: Gauges implement `role="meter"` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`.
- **Keyboard Navigation**: All interactive elements display visible focus outlines via `focus-visible:ring-2 focus-visible:ring-cyan-400`.

