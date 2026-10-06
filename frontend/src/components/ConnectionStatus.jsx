import React from 'react';
import { Wifi, Radio, Server, Database, Cable, CheckCircle2, XCircle } from 'lucide-react';

export const ConnectionStatus = ({ connection }) => {
  const services = [
    {
      id: 'sensor',
      name: 'HC-SR04 Sensor',
      icon: Cable,
      status: connection?.sensor || 'CONNECTED',
      subtext: 'GPIO 5 / GPIO 18 (Divider)',
    },
    {
      id: 'mqtt',
      name: 'MQTT Broker',
      icon: Radio,
      status: connection?.mqtt || 'CONNECTED',
      subtext: 'Topic: water/tank1/#',
    },
    {
      id: 'backend',
      name: 'Express Backend',
      icon: Server,
      status: connection?.backend || 'ONLINE',
      subtext: 'REST API & Socket.IO',
    },
    {
      id: 'database',
      name: 'PostgreSQL DB',
      icon: Database,
      status: connection?.database || 'CONNECTED',
      subtext: 'smart_water_monitoring',
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Wifi className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">System Connectivity Link</h2>
          </div>
          <span className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>ALL SYSTEMS HEALTHY</span>
          </span>
        </div>

        {/* 4-Pillar Grid */}
        <div className="grid grid-cols-2 gap-3">
          {services.map((svc) => {
            const Icon = svc.icon;
            const isOnline = svc.status === 'CONNECTED' || svc.status === 'ONLINE';

            return (
              <div
                key={svc.id}
                className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/70 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isOnline ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white truncate">{svc.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{svc.subtext}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Status:</span>
                  <span className={`font-bold ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {svc.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-800/60 flex items-center justify-between">
        <span>Protocol: MQTT over TCP / WebSockets</span>
        <span>Polling: Reactive Socket.IO</span>
      </div>
    </div>
  );
};

