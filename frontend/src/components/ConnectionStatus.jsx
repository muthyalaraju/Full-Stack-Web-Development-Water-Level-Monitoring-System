import React from 'react';
import { Wifi, Radio, Server, Database, Cable, CheckCircle2, AlertOctagon } from 'lucide-react';

export const ConnectionStatus = ({ connection }) => {
  // Normalize status strings strictly to 'CONNECTED' or 'DISCONNECTED'
  const normalizeStatus = (raw) => {
    if (!raw) return 'CONNECTED';
    const upper = String(raw).toUpperCase();
    if (upper === 'ONLINE' || upper === 'ACTIVE' || upper === 'CONNECTED') {
      return 'CONNECTED';
    }
    return 'DISCONNECTED';
  };

  const services = [
    {
      id: 'sensor',
      name: 'HC-SR04 Sensor',
      icon: Cable,
      status: normalizeStatus(connection?.sensor),
      subtext: 'GPIO 5 / GPIO 18 (Divider)',
    },
    {
      id: 'mqtt',
      name: 'MQTT Broker',
      icon: Radio,
      status: normalizeStatus(connection?.mqtt),
      subtext: 'Topic: water/tank1/#',
    },
    {
      id: 'backend',
      name: 'Express Backend',
      icon: Server,
      status: normalizeStatus(connection?.backend),
      subtext: 'REST API & Socket.IO',
    },
    {
      id: 'database',
      name: 'PostgreSQL DB',
      icon: Database,
      status: normalizeStatus(connection?.database),
      subtext: 'smart_water_monitoring',
    },
  ];

  const allConnected = services.every((s) => s.status === 'CONNECTED');

  return (
    <article
      className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between"
      aria-label="System Connection Status"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Wifi className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">System Connection Status</h2>
          </div>
          <span
            className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              allConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                allConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            ></span>
            <span>{allConnected ? 'ALL CONNECTED' : 'DEGRADED LINK'}</span>
          </span>
        </div>

        {/* 4-Pillar Grid */}
        <div className="grid grid-cols-2 gap-3">
          {services.map((svc) => {
            const Icon = svc.icon;
            const isConnected = svc.status === 'CONNECTED';

            return (
              <div
                key={svc.id}
                className={`p-3 rounded-xl border transition-all ${
                  isConnected
                    ? 'bg-slate-950/70 border-slate-800/70'
                    : 'bg-rose-950/20 border-rose-900/40'
                } flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      isConnected
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/15 text-rose-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isConnected ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white truncate">{svc.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                    {svc.subtext}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Link:</span>
                  <span
                    className={`font-bold uppercase tracking-wider ${
                      isConnected ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {svc.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800/60 flex items-center justify-between font-mono mt-3">
        <span>Protocol: MQTT / WebSockets</span>
        <span>Bridge: Socket.IO Live</span>
      </div>
    </article>
  );
};
