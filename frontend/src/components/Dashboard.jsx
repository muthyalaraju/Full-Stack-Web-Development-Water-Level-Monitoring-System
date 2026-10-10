import React from 'react';
import { useSensorData } from '../hooks/useSensorData';
import { Navbar } from './Navbar';
import { WaterLevelCard } from './WaterLevelCard';
import { TankStatusCard } from './TankStatusCard';
import { PumpStatusCard } from './PumpStatusCard';
import { PumpControl } from './PumpControl';
import { WaterLevelChart } from './WaterLevelChart';
import { SensorDetails } from './SensorDetails';
import { AlertPanel } from './AlertPanel';
import { ConnectionStatus } from './ConnectionStatus';
import { RecentReadings } from './RecentReadings';
import { Footer } from './Footer';
import { RefreshCw, AlertCircle, Clock, Radio } from 'lucide-react';

export const Dashboard = () => {
  const {
    tank,
    reading,
    history,
    pump,
    alerts,
    connection,
    lastUpdated,
    loading,
    error,
    actionLoading,
    controlPump,
    refreshData,
  } = useSensorData();

  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString()
    : 'Awaiting first packet';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Header / Navigation Bar */}
      <Navbar connection={connection} />

      {/* Main Content Dashboard */}
      <main
        id="main-content"
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
        tabIndex="-1"
      >
        {/* Global Error Notice (if any) */}
        {error && (
          <div
            role="alert"
            className="bg-rose-500/15 border border-rose-500/30 text-rose-200 p-4 rounded-2xl flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span className="text-xs sm:text-sm font-semibold">{error}</span>
            </div>
            <button
              onClick={refreshData}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-bold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              aria-label="Retry refreshing telemetry"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* 13. Top Overview: Node Target, Real-Time Protocol, and Last Updated Timestamp */}
        <section
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900/70 border border-slate-800/80 p-4 sm:p-5 rounded-2xl gap-3 shadow-md"
          aria-label="Dashboard Overview and Telemetry Status"
        >
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Academic IoT Monitoring Console
              </h2>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                <Radio className="w-3 h-3 text-cyan-400" />
                <span>Socket.IO Stream Active</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active Monitored Node: <strong className="text-slate-200">Tank #1 (Prototype Calibrated 20cm)</strong> &middot; Automated Hysteresis Actuation
            </p>
          </div>

          <div className="flex items-center space-x-3 self-stretch sm:self-auto justify-between sm:justify-end">
            <div
              className="flex items-center space-x-1.5 text-xs text-slate-300 font-mono bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800"
              title="Last received sensor telemetry packet"
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Last Packet: <strong className="text-white">{formattedLastUpdated}</strong></span>
            </div>

            <button
              onClick={refreshData}
              disabled={loading}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              aria-label="Refresh telemetry data from backend"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </section>

        {/* Row 1: Water Level Card (with Vertical/Circular Gauge) + Tank Status + Pump Status */}
        <section
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          aria-label="Primary Monitoring Cards"
        >
          {/* Item 3 & 4: Water Level Card + Circular / Vertical Indicator */}
          <WaterLevelCard
            reading={reading}
            loading={loading}
            error={error}
            onRefresh={refreshData}
          />

          {/* Item 5: Tank Specifications and Calibrated Status */}
          <TankStatusCard
            tank={tank}
            reading={reading}
          />

          {/* Item 6: Confirmed Pump Relay Status */}
          <PumpStatusCard
            pump={pump}
          />
        </section>

        {/* Row 2: Pump Actuator Control Console + Sensor Hardware Math */}
        <section
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          aria-label="Pump Actuation and Hardware Science"
        >
          {/* Item 7: Pump Control Console (TURN ON, TURN OFF, AUTO) */}
          <PumpControl
            pump={pump}
            onControl={controlPump}
            loading={actionLoading}
          />

          {/* Item 10: Sensor Information, Pin Matrix, and Physics Equations */}
          <SensorDetails
            reading={reading}
            tank={tank}
          />
        </section>

        {/* Row 3: Items 8 & 9: Real-Time Water-Level Chart & Historical Chart */}
        <section aria-label="Telemetry Visualization and Historical Analytics">
          <WaterLevelChart
            history={history}
            loading={loading}
          />
        </section>

        {/* Row 4: System Connection Status + Alerts Panel */}
        <section
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          aria-label="System Network Links and Alerts"
        >
          {/* Item 2: System Connection Status (CONNECTED / DISCONNECTED) */}
          <ConnectionStatus
            connection={connection}
          />

          {/* Item 11: Real-Time Alerts and PostgreSQL Audit Events */}
          <AlertPanel
            alerts={alerts}
            reading={reading}
          />
        </section>

        {/* Row 5: Item 12: Recent Historical Readings Table */}
        <section aria-label="Recent Sensor Readings Data Table">
          <RecentReadings
            history={history}
            loading={loading}
          />
        </section>
      </main>

      {/* Item 14: Academic Capstone Footer */}
      <Footer />
    </div>
  );
};
