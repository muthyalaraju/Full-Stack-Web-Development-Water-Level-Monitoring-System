# Complete System Setup & Installation Guide

This guide walks you through setting up the entire **Smart Water Level Monitoring System** on your local machine and physical hardware.

---

## Prerequisites
1. **Node.js**: v18.0+ (Installed: v24.x)
2. **PostgreSQL**: v14+ (Installed: v18.x)
3. **MQTT Broker**: Local Mosquitto / EMQX or public test broker (e.g. `broker.emqx.io` or `test.mosquitto.org`)
4. **Arduino IDE**: For compiling and flashing the ESP32 firmware with libraries:
   - `WiFi`
   - `PubSubClient` (by Nick O'Leary)
   - `LiquidCrystal_I2C` (by Frank de Brabander)
   - `ArduinoJson` (v6 or v7 by Benoit Blanchon)

---

## Step 1: Database Setup
1. Open PowerShell / Command Prompt:
   ```powershell
   psql -U postgres
   ```
2. Create database:
   ```sql
   CREATE DATABASE smart_water_monitoring;
   \q
   ```
3. Execute schema and seed:
   ```powershell
   psql -U postgres -d smart_water_monitoring -f ./database/schema.sql
   psql -U postgres -d smart_water_monitoring -f ./database/seed.sql
   ```

---

## Step 2: Backend Setup
1. Navigate to `backend`:
   ```bash
   cd backend
   npm install
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your PostgreSQL password and chosen MQTT broker host.
4. Start backend:
   ```bash
   npm run dev
   ```

---

## Step 3: Frontend Dashboard Setup
1. Navigate to `frontend`:
   ```bash
   cd ../frontend
   npm install
   ```
2. Start Vite dev server:
   ```bash
   npm run dev
   ```
3. Open your browser at `http://localhost:5173`.

---

## Step 4: ESP32 Hardware Flashing
1. Connect ESP32 to your PC via Micro-USB cable.
2. Open `esp32/water_monitor.ino` in Arduino IDE.
3. Select Board: **ESP32 Dev Module**.
4. Update `WIFI_SSID`, `WIFI_PASSWORD`, and `MQTT_BROKER_IP` in the sketch.
5. Click **Upload**.
