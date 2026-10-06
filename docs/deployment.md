# Cloud Deployment Runbook: Vercel, Render & Hosted PostgreSQL

This production runbook provides step-by-step instructions for deploying the **IoT-Based Smart Water Level Monitoring and Management System** using modern cloud platforms:
- **Frontend**: Vercel (React 19 + Vite SPA)
- **Backend**: Render (Node.js + Express + MQTT.js + Socket.IO)
- **Database**: Hosted PostgreSQL (Neon, Supabase, or Render PostgreSQL)

---

## 1. Cloud Architecture & Data Links

```
+-------------------------------------------------------------+
|               FRONTEND: VERCEL (React 19 SPA)               |
|            https://smart-water-monitoring.vercel.app        |
|                                                             |
|   Env:                                                      |
|   - VITE_API_URL=https://water-backend.onrender.com/api     |
|   - VITE_SOCKET_URL=https://water-backend.onrender.com      |
+------------------------------▲------------------------------+
                               │ REST & WebSockets (WSS)
                               │ (CORS Allowed)
+------------------------------▼------------------------------+
|               BACKEND: RENDER (Web Service)                 |
|             https://water-backend.onrender.com              |
|                                                             |
|   Env:                                                      |
|   - PORT (Auto-assigned by Render)                          |
|   - NODE_ENV=production                                     |
|   - DATABASE_URL=postgresql://user:pwd@neon.tech/db?ssl=... |
|   - MQTT_BROKER_URL=mqtt://broker.emqx.io:1883             |
|   - FRONTEND_URL=https://smart-water-monitoring.vercel.app |
+------------------▲-----------------------▲------------------+
                   │ (pg Pool with SSL)    │ (MQTT TCP / TLS)
                   ▼                       ▼
+-------------------------+      +----------------------------+
|   HOSTED POSTGRESQL     |      |      EMQX MQTT BROKER      |
|   (Neon / Supabase /    |      |  broker.emqx.io:1883       |
|    Render PostgreSQL)   |      |  Topic: water/tank1/#      |
+-------------------------+      +----------------------------+
                                               ▲
                                               │ Wi-Fi Telemetry
                                 +-------------┴--------------+
                                 |     PHYSICAL ESP32 NODE    |
                                 |  (or Hardware Simulator)   |
                                 +----------------------------+
```

---

## 2. Step 1: Hosted PostgreSQL Database Setup

You can use any free hosted PostgreSQL provider (such as **Neon.tech**, **Supabase**, or **Render PostgreSQL**).

### 2.1 Provision Database
1. Sign up at [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com).
2. Create a new PostgreSQL database named `smart_water_monitoring`.
3. Copy the **Connection String (URI)**. It looks like:
   ```
   postgresql://water_user:mypassword@ep-dry-water-123456.us-east-2.aws.neon.tech/smart_water_monitoring?sslmode=require
   ```

### 2.2 Initialize Schema and Seed Data
Connect to the hosted database using `psql` or the web SQL Editor in your provider dashboard:
1. Paste and run [database/schema.sql](file:///c:/Users/muthy/OneDrive/Desktop/Water%20Level%20Monitoring%20Full%20Stack%20Web%20Development%20Project/database/schema.sql).
2. Paste and run [database/seed.sql](file:///c:/Users/muthy/OneDrive/Desktop/Water%20Level%20Monitoring%20Full%20Stack%20Web%20Development%20Project/database/seed.sql).
3. Verify that tables `tanks`, `sensor_readings`, `pump_status`, and `system_events` are created with `Tank 1` present in `tanks`.

---

## 3. Step 2: Backend Deployment on Render

### 3.1 Create Web Service
1. Sign up at [render.com](https://render.com) and link your GitHub repository.
2. In the Render Dashboard, click **New + $\rightarrow$ Web Service**.
3. Select your repository.
4. Configure service settings:
   - **Name**: `smart-water-monitoring-backend`
   - **Region**: Oregon (US West) or closest region
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Instance Type**: `Free`

### 3.2 Configure Environment Variables in Render
Under the **Environment** tab, add the following key-value pairs:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations. |
| `DATABASE_URL` | `postgresql://...neon.tech/smart_water_monitoring?sslmode=require` | Connection string to your hosted PostgreSQL. |
| `MQTT_BROKER_URL` | `mqtt://broker.emqx.io:1883` | MQTT Broker URL. |
| `MQTT_USERNAME` | *(Leave empty or set if private)* | Broker credentials. |
| `MQTT_PASSWORD` | *(Leave empty or set if private)* | Broker credentials. |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Vercel domain for CORS protection. |

> [!NOTE]
> Render automatically sets the `PORT` environment variable and injects it into Node.js. The backend is configured to bind to `process.env.PORT`.

### 3.3 Verify Deployment
Once deployed, click your Render service URL (e.g. `https://smart-water-monitoring-backend.onrender.com`):
- `GET /` returns:
  ```json
  {
    "project": "IoT-Based Smart Water Level Monitoring and Management System",
    "status": "ONLINE",
    "version": "1.0.0"
  }
  ```
- `GET /api/health` returns status `UP` with database `CONNECTED` and MQTT `CONNECTED`.

---

## 4. Step 3: Frontend Deployment on Vercel

### 4.1 Deploy Vite SPA
1. Sign up at [vercel.com](https://vercel.com) and click **Add New... $\rightarrow$ Project**.
2. Import your GitHub repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 4.2 Configure Environment Variables in Vercel
Expand **Environment Variables** and add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://smart-water-monitoring-backend.onrender.com/api` | Render backend REST API endpoint. |
| `VITE_SOCKET_URL` | `https://smart-water-monitoring-backend.onrender.com` | Render backend Socket.IO endpoint. |

4. Click **Deploy**. Vercel will build the frontend via Vite and provide a production URL (e.g., `https://smart-water-monitoring.vercel.app`).
5. Copy your Vercel URL and paste it back into the Render `FRONTEND_URL` setting so that CORS permits the requests.

---

## 5. Security & Verification Checklist

- [x] **No Secrets in Git**: No `.env` files are tracked in source control; `.gitignore` strictly ignores `.env` and `.env.*`.
- [x] **CORS Lockdown**: Backend only accepts requests from localhost, your designated Vercel domain, and `.vercel.app` preview branches.
- [x] **SSL for Hosted DB**: `backend/src/db/index.js` automatically enables `ssl: { rejectUnauthorized: false }` when connecting to hosted cloud databases (Neon, Supabase, Render).
- [x] **Flexible URLs**: Frontend services normalize `VITE_API_URL` and `VITE_SOCKET_URL` regardless of whether trailing slashes or `/api` are entered.
- [x] **SPA Routing**: `frontend/vercel.json` ensures that deep links and client routing redirect correctly to `/index.html`.
- [x] **WebSockets Over WSS**: Socket.IO connects over secure WebSockets (`wss://`) automatically on production HTTPS URLs.
