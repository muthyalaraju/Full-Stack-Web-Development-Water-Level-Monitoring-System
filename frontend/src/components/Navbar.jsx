import React from 'react';
import { Waves, Activity, Radio, Zap } from 'lucide-react';

export const Navbar = ({ connection }) => {
  const isLive = connection?.isLive || connection?.socket === 'CONNECTED';

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
              <Waves className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Smart Water Monitoring
                </h1>
                {/* Real-Time Live Indicator */}
                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                  isLive
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
                  <span>{isLive ? 'LIVE' : 'POLLING'}</span>
                </span>
              </div>
              <p className="text-xs text-cyan-400 font-medium hidden sm:block">
                ESP32 &middot; HC-SR04 &middot; MQTT &middot; Socket.IO &middot; PostgreSQL
              </p>
            </div>
          </div>

          {/* System Badges & Telemetry status */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="font-medium">Tank #1 (Prototype)</span>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs">
              <Radio className={`w-3.5 h-3.5 ${connection?.mqtt === 'CONNECTED' ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="text-slate-300 hidden sm:inline">MQTT:</span>
              <span className={connection?.mqtt === 'CONNECTED' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                {connection?.mqtt || 'CONNECTED'}
              </span>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300 hidden sm:inline">Backend:</span>
              <span className={connection?.backend === 'ONLINE' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                {connection?.backend || 'ONLINE'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
