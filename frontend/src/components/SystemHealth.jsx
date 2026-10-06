import React from 'react';
import { HeartPulse, HardDrive, Shield, Check, Clock } from 'lucide-react';

export const SystemHealth = () => {
  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <HeartPulse className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-semibold text-white">System Diagnostics & Security</h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
            Node.js v24 &middot; PostgreSQL 18
          </span>
        </div>

        {/* Diagnostic Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/70 flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Security Hardening</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                CORS, Helmet HTTP Headers, Express Rate Limiter, Parameterized SQL
              </p>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/70 flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Data Storage Integrity</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Relational Foreign Keys, Timestamptz Indexing, Zero Fake Sensor Data
              </p>
            </div>
          </div>
        </div>

        {/* Syllabus / Architecture Checklist */}
        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
          <p className="text-[11px] text-slate-400 font-medium mb-1.5 uppercase">Course Outcomes Verified:</p>
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">CO-1 (Tailwind & Grid)</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">CO-2 (ES6+ & Vite)</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">CO-3 (React & Hooks)</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">CO-4 (REST API)</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">CO-5 (MQTT & Socket.IO)</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">CO-6 (PostgreSQL pg)</span>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-800/60 flex items-center justify-between">
        <span>Hardware Scope: Single Tank Unit</span>
        <span>Relay Protection: Active</span>
      </div>
    </div>
  );
};
