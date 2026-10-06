import React from 'react';
import { Waves, Activity, Radio, ShieldCheck, Cpu } from 'lucide-react';

export const Navbar = ({ connection }) => {
  const isLive = connection?.isLive || connection?.socket === 'CONNECTED';
  const mqttConnected = connection?.mqtt === 'CONNECTED';
  const backendOnline = connection?.backend === 'ONLINE';

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main Navigation">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Academic Project Title */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white shrink-0">
              <Waves className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent truncate">
                  Smart Water Monitoring System
                </h1>
                {/* Real-Time Stream Status Badge */}
                <span
                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                    isLive
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isLive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                    }`}
                  ></span>
                  <span>{isLive ? 'STREAMING' : 'POLLING'}</span>
                </span>
              </div>
              <p className="text-[11px] text-cyan-400 font-medium hidden sm:block">
                ESP32 &middot; HC-SR04 &middot; EMQX MQTT &middot; Socket.IO &middot; PostgreSQL &middot; React
              </p>
            </div>
          </div>

          {/* System Badges & Telemetry Links */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="font-semibold">Node: Tank #1</span>
            </div>

            {/* MQTT Link Badge */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-mono ${
                mqttConnected
                  ? 'bg-slate-800/80 border-slate-700/80'
                  : 'bg-rose-950/40 border-rose-800/60'
              }`}
              title={`MQTT Broker: ${mqttConnected ? 'CONNECTED' : 'DISCONNECTED'}`}
            >
              <Radio
                className={`w-3.5 h-3.5 ${
                  mqttConnected ? 'text-emerald-400' : 'text-rose-400 animate-pulse'
                }`}
              />
              <span className="text-slate-400 hidden sm:inline font-sans">MQTT:</span>
              <span
                className={`font-bold uppercase tracking-wider ${
                  mqttConnected ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {mqttConnected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>

            {/* Backend Server Badge */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-mono ${
                backendOnline
                  ? 'bg-slate-800/80 border-slate-700/80'
                  : 'bg-rose-950/40 border-rose-800/60'
              }`}
              title={`Backend: ${backendOnline ? 'CONNECTED' : 'DISCONNECTED'}`}
            >
              <Activity
                className={`w-3.5 h-3.5 ${
                  backendOnline ? 'text-emerald-400' : 'text-rose-400'
                }`}
              />
              <span className="text-slate-400 hidden sm:inline font-sans">Backend:</span>
              <span
                className={`font-bold uppercase tracking-wider ${
                  backendOnline ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {backendOnline ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
