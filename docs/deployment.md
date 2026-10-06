# Deployment & Production Runbook

This guide covers deployment procedures for the **IoT-Based Smart Water Level Monitoring and Management System** across local college demonstrations and production cloud environments.

---

## 1. System Requirements

### Hardware:
- **Microcontroller**: ESP32 DevKit V1 (30-pin or 38-pin)
- **Ultrasonic Sensor**: HC-SR04 (5V VCC, 40 kHz)
- **Relay Module**: 5V 1-Channel Optocoupled Relay (Active LOW / HIGH)
- **Pump**: Submersible 5V DC Mini Water Pump
- **External Power Supply**: 5V 2A DC Power Adapter (Dedicated for pump and sensors)
- **Display**: 16x2 I2C LCD Display (PCF8574 I2C Backpack, address `0x27` or `0x3F`)
- **Resistors**: 1 kΩ and 2 kΩ (or 1.8 kΩ and 3.3 kΩ) for Echo voltage divider

### Software & Run-Times:
- **Node.js**: v20.x or v22.x+ LTS
- **PostgreSQL**: v14.x, v16.x, or v18.x
- **MQTT Broker**: EMQX Cloud, public EMQX broker (`broker.emqx.io:1883`), or local Eclipse Mosquitto
- **Arduino IDE**: v2.x with ESP32 board support package

---

## 2. Local Demonstration Deployment

For laboratory evaluation or college capstone presentation:

### Step 1: Database Setup
1. Launch PostgreSQL service.
2. Create database:
   ```sql
   CREATE DATABASE smart_water_monitoring;
   ```
3. Initialize tables and seed:
   ```powershell
   psql -U postgres -d smart_water_monitoring -f database/schema.sql
   psql -U postgres -d smart_water_monitoring -f database/seed.sql
   ```

### Step 2: Backend Service
1. Configure `backend/.env`:
   ```ini
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/smart_water_monitoring
   MQTT_BROKER_URL=mqtt://broker.emqx.io:1883
   MQTT_USERNAME=
   MQTT_PASSWORD=
   FRONTEND_URL=http://localhost:5173
   ```
2. Start the server:
   ```powershell
   cd backend
   npm install
   npm start
   ```

### Step 3: Frontend Web Dashboard
1. Install and start Vite dev server:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
2. Open `http://localhost:5173` in your browser.

### Step 4: Hardware Connection or Simulator
- **Hardware Mode**: Power the ESP32. It connects to Wi-Fi and begins publishing to `water/tank1/reading`.
- **Simulation Mode**: Run `node backend/src/utils/hardwareSimulator.js` to simulate live filling and draining in real-time.

---

## 3. Production Linux / Cloud Deployment

### 3.1 Backend Process Management with PM2
Install PM2 globally:
```bash
npm install -g pm2
```
Start backend cluster:
```bash
cd /opt/water-monitoring/backend
npm install --production
pm2 start src/server.js --name "water-backend" -i max
pm2 save
pm2 startup
```

### 3.2 Nginx Reverse Proxy Configuration
Sample Nginx block handling both REST API, Socket.IO WebSockets, and static frontend:

```nginx
server {
    listen 80;
    server_name water-monitor.example.com;

    # Static Frontend SPA
    location / {
        root /opt/water-monitoring/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend REST API
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Socket.IO WebSocket Stream
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3.3 Production Security Checklist
- [x] **Helmet Headers**: Enabled on all HTTP responses.
- [x] **Rate Limiting**: Configured (100 requests per 15 minutes per IP on `/api/`).
- [x] **Relay Electrical Isolation**: Relay optocoupler protects microcontroller from high pump inrush current.
- [x] **Logic Voltage Stepping**: Resistor voltage divider protects ESP32 GPIO 18 from 5V ultrasonic echo pulses.
- [x] **CORS Lockdown**: Confined strictly to trusted frontend origins.
- [x] **Database Security**: Parameterized queries prevent SQL injection.
