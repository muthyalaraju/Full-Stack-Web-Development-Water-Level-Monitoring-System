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
import { SystemHealth } from './SystemHealth';
import { RecentReadings } from './RecentReadings';
import { Footer } from './Footer';
import { RefreshCw, AlertCircle } from 'lucide-react';

export const Dashboard = () => {
  const {
    tank,
    reading,
    history,
    pump,
    alerts,
    connection,
    loading,
    error,
    actionLoading,
    controlPump,
    refreshData,
  } = useSensorData();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* 1. Header / Navigation */}
      <Navbar connection={connection} />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Global Error Banner (if any) */}
        {error && (
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-xs sm:text-sm font-medium">{error}</span>
            </div>
            <button
              onClick={refreshData}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 rounded-lg text-xs font-semibold text-white transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Top Overview: Quick Status Banner */}
        <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Live Monitoring Console</h2>
            <p className="text-xs text-slate-400">
              Active telemetry node: <span className="text-cyan-400 font-medium">Tank #1 (Prototype 20cm)</span> &middot; HC-SR04 Active
            </p>
          </div>
          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-300 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Data</span>
          </button>
        </section>

        {/* Primary Row: Water Level Card + Tank Specs + Pump Actuator State */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Section 2: Current Water Level (with interactive gauge) */}
          <WaterLevelCard
            reading={reading}
            loading={loading}
            error={error}
            onRefresh={refreshData}
          />

          {/* Section 3: Water & Tank Status Specifications */}
          <TankStatusCard
            tank={tank}
            reading={reading}
          />

          {/* Section 4: Pump Relay Actuator Status */}
          <PumpStatusCard
            pump={pump}
          />
        </section>

        {/* Secondary Row: Pump Control Console + Sensor Hardware Math */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 5: Pump Control Console */}
          <PumpControl
            pump={pump}
            onControl={controlPump}
            loading={actionLoading}
          />

          {/* Section 7: Sensor Information & Math */}
          <SensorDetails
            reading={reading}
            tank={tank}
          />
        </section>

        {/* Section 6: Water-Level Real-Time Trend Chart */}
        <section>
          <WaterLevelChart
            history={history}
            loading={loading}
          />
        </section>

        {/* Tertiary Row: System Connectivity Link + System Diagnostics + Alerts */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Section 8: Connection Status */}
          <ConnectionStatus
            connection={connection}
          />

          {/* Section 11: System Diagnostics & Course Outcomes */}
          <SystemHealth />

          {/* Section 9: Real-Time Alerts & System Events */}
          <AlertPanel
            alerts={alerts}
            reading={reading}
          />
        </section>

        {/* Section 10: Recent Historical Readings Table */}
        <section>
          <RecentReadings
            history={history}
            loading={loading}
          />
        </section>
      </main>

      {/* 12. Footer */}
      <Footer />
    </div>
  );
};
