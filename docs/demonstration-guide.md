# College Project Demonstration & Viva Walkthrough Guide

**Project Title**: IoT-Based Smart Water Level Monitoring and Management System  
**Scope**: Single Physical Prototype Tank (Tank 1)  
**Hardware**: ESP32 &middot; HC-SR04 &middot; 5V Single-Channel Relay &middot; 5V DC Pump &middot; 16x2 I2C LCD  
**Software Stack**: Node.js &middot; Express.js &middot; PostgreSQL &middot; MQTT &middot; Socket.IO &middot; React.js &middot; Tailwind CSS &middot; Chart.js  

---

## 1. Quick Startup Sequence for Demonstration

Open three terminal windows on your laptop:

### Terminal 1: PostgreSQL & Node.js Backend
```powershell
# Navigate to backend
cd backend

# Start backend server
npm run dev
```
*Expected Output:*
```text
🚀 Smart Water Monitoring Backend running on port 5000
✅ PostgreSQL Connected successfully to [smart_water_monitoring]
✅ [MQTT Connected] Broker: mqtt://broker.emqx.io:1883
📡 [MQTT Subscribed] Topics: water/tank1/reading, water/tank1/pump/status, water/tank1/system/status
⚡ [Socket.IO Initialized] Real-time event bridge active.
```

### Terminal 2: React Dashboard (Frontend)
```powershell
# Navigate to frontend
cd frontend

# Start Vite development server
npm run dev
```
Open **`http://localhost:5173`** in your browser. Notice the green pulsing **LIVE** indicator and active system connection pills.

### Terminal 3: Physical ESP32 (or Virtual Prototype Simulator)
- **If using physical ESP32**: Plug into USB cable or 5V power adapter. It connects to Wi-Fi and MQTT automatically.
- **If demonstrating without hardware connected**:
  ```powershell
  cd backend
  node src/utils/hardwareSimulator.js
  ```
  *(Simulates dynamic water level physics, HC-SR04 measurements, and relay switching).*

---

## 2. Walkthrough of the 8 Required Test Cases

### TEST 1: Physical Water Level Telemetry Pipeline
1. **Action**: Change the water level in the prototype tank (or observe the simulator).
2. **Demonstration**:
   - HC-SR04 measures echo time $\rightarrow$ ESP32 derives distance and water height.
   - 16x2 LCD immediately updates line 1 (`Level: XX%`).
   - ESP32 publishes JSON payload to MQTT topic `water/tank1/reading`.
   - Node.js backend validates payload and stores it in PostgreSQL `sensor_readings`.
   - Socket.IO emits `waterReading` to React.
   - **Result**: The dashboard tank gauge animates and the line chart updates in real-time **without refreshing the browser**.

---

### TEST 2: Autonomous LOW Water Trigger ($\le 20\%$)
1. **Action**: Lower water level below $20\%$ (or simulator drains below $20\%$).
2. **Demonstration**:
   - Status changes to `LOW` (gauge turns red).
   - Alert panel displays critical warning: *"Tank water level reached 18% (<= 20% LOW threshold)"*.
   - Backend evaluates autonomous logic and publishes `{ "command": "ON", "mode": "AUTO" }` to `water/tank1/pump/command`.
   - ESP32 closes relay on **GPIO 23**, turning on the external 5V DC pump.
   - ESP32 publishes confirmed state to `water/tank1/pump/status`.
   - **Result**: Dashboard Pump card switches to `PUMP RUNNING (ON) [RELAY CLOSED]` and LCD updates to `Pump: ON [AUTO]`.

---

### TEST 3: Tank Fill to FULL Threshold ($\ge 80\%$) & Hysteresis
1. **Action**: Allow the pump to fill the tank to $\ge 80\%$.
2. **Demonstration**:
   - While water rises from $21\%$ to $79\%$, **hysteresis** keeps the pump running steadily (no premature shutoff).
   - Once water crosses $80\%$, status changes to `FULL` (gauge turns emerald green).
   - Backend publishes `{ "command": "OFF", "mode": "AUTO" }`.
   - ESP32 opens relay on GPIO 23, stopping the 5V DC pump.
   - **Result**: Confirmed status reflects `PUMP STOPPED (OFF)`.

---

### TEST 4: Manual Pump Control Overrides
1. **Action**: On the React Dashboard, click **TURN ON**, **TURN OFF**, or **AUTO**.
2. **Demonstration**:
   - Notice the UI displays *"Command dispatched to MQTT. Awaiting ESP32 hardware relay confirmation..."*
   - Explains the safety design: **the dashboard never claims the pump is ON prematurely.**
   - Physical ESP32 closes the relay, confirms physical state, and only then does the UI confirm `PUMP RUNNING`.
   - **Conflict Prevention**: Click "TURN ON" while already running $\rightarrow$ UI button is disabled and backend returns `409 Conflict`.

---

### TEST 5: MQTT Disconnect State Detection
1. **Action**: Disconnect internet/Wi-Fi or test with `curl.exe -s http://localhost:5000/api/health`.
2. **Demonstration**:
   - The health check reveals `"mqtt": "DISCONNECTED"`.
   - Top navigation bar updates status pill to yellow/red.
   - System automatically enters reconnection loop every 5 seconds.

---

### TEST 6: Backend Service Restart Resilience
1. **Action**: Press Ctrl+C in Terminal 1 and restart the backend.
2. **Demonstration**:
   - Backend automatically re-establishes:
     1. PostgreSQL connection pool (`pg.Pool`)
     2. MQTT subscriber on `broker.emqx.io`
     3. Socket.IO attached server engine
   - Dashboard automatically reconnects via Socket.IO without page reload.

---

### TEST 7: Browser Refresh & PostgreSQL Historical Queries
1. **Action**: Press F5 to refresh the browser dashboard.
2. **Demonstration**:
   - Notice that the **historical readings table** and **trend chart** immediately reload past readings directly from PostgreSQL (`sensor_readings`).
   - Use the **Time Range Selector** ("Last 1 Hour", "Last 6 Hours", "Last 24 Hours") to show SQL parameterized filtering:
     ```sql
     SELECT * FROM sensor_readings WHERE tank_id = 1 AND created_at >= $1 ORDER BY created_at ASC;
     ```

---

### TEST 8: ESP32 Hardware Lifecycle & LWT (Last Will and Testament)
1. **Action**: Power cycle or unplug the ESP32.
2. **Demonstration**:
   - MQTT Broker detects sudden disconnection and immediately publishes ESP32's configured **LWT message**:
     `{ "status": "OFFLINE", "reason": "Microcontroller power loss" }`
   - When powered back on, ESP32 reconnects to Wi-Fi, syncs to MQTT, and broadcasts `{ "status": "ONLINE" }`.

---

## 3. Academic Viva & Syllabus Alignment (Course Outcomes)

| Course Outcome | Implementation Demonstrated in Code |
| :--- | :--- |
| **CO-1: HTML5 & Responsive CSS** | Semantic layout (`<header>`, `<main>`, `<section>`, `<footer>`), Tailwind CSS Grid, Flexbox, and mobile-first responsive design. |
| **CO-2: Modern JavaScript (ES6+)** | Arrow functions, async/await, Array map/filter/slice, destructuring, Fetch API, and Vite tooling. |
| **CO-3: React.js Architecture** | Modular components, React `useState`, `useEffect`, `useCallback`, `useMemo`, custom hook `useSensorData()`, and Chart.js integration. |
| **CO-4: Node.js & Express REST Backend** | REST endpoints (`/api/health`, `/api/tank`, `/api/pump`, `/api/events`), Helmet security headers, CORS, Express rate limiting, and centralized error handling middleware. |
| **CO-5: Real-Time & MQTT Integration** | MQTT client with reconnect resilience, single-tank validation, QoS 1 delivery, and Socket.IO real-time event pipeline (`waterReading`, `pumpStatus`, `waterAlert`). |
| **CO-6: PostgreSQL Database** | PostgreSQL connection pool (`pg`), parameterized SQL queries, relational foreign keys with `ON DELETE CASCADE`, and B-Tree indexing on `(tank_id, created_at DESC)`. |
