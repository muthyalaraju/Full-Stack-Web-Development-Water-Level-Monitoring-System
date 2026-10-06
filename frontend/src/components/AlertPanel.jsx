import React from 'react';
import { AlertTriangle, AlertCircle, Info, Bell, CheckCircle2 } from 'lucide-react';
import { ALERT_SEVERITY } from '../utils/constants';

export const AlertPanel = ({ alerts = [], reading }) => {
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case ALERT_SEVERITY.CRITICAL:
      case ALERT_SEVERITY.ERROR:
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-400" />,
          bg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
        };
      case ALERT_SEVERITY.WARNING:
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
        };
      default:
        return {
          icon: <Info className="w-4 h-4 text-cyan-400" />,
          bg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
        };
    }
  };

  // Derive dynamic real-time alert banner from latest sensor reading
  const activeWarning = (() => {
    if (!reading) return null;
    if (reading.water_level_percent <= 20) {
      return {
        title: 'CRITICAL: Water Level Low (≤ 20%)',
        desc: 'Tank water level is depleted. Pump auto-triggered or requires supply refill.',
        severity: 'CRITICAL',
      };
    }
    if (reading.water_level_percent >= 80) {
      return {
        title: 'NOTICE: Tank Filled to Capacity (≥ 80%)',
        desc: 'Tank has reached safe maximum threshold. Pump stopped to avoid overflow.',
        severity: 'WARNING',
      };
    }
    return null;
  })();

  return (
    <article
      className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between"
      aria-label="System Alerts and Event Notifications"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-white">Alerts & System Events</h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
            {alerts.length} logged
          </span>
        </div>

        {/* Real-time Dynamic Banner */}
        {activeWarning && (
          <div
            role="alert"
            aria-live="assertive"
            className={`p-3.5 rounded-xl border mb-3 flex items-start space-x-3 ${
              activeWarning.severity === 'CRITICAL'
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-200'
            }`}
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">{activeWarning.title}</p>
              <p className="text-[11px] opacity-90 mt-0.5">{activeWarning.desc}</p>
            </div>
          </div>
        )}

        {/* Audit Log List */}
        <div
          className="space-y-2 max-h-56 overflow-y-auto pr-1"
          role="feed"
          aria-label="Recent system alerts list"
        >
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs flex flex-col items-center">
              <CheckCircle2 className="w-8 h-8 text-slate-600 mb-2" />
              <span className="text-slate-400 font-medium">All telemetry within nominal thresholds.</span>
              <span className="text-[10px] text-slate-500 mt-0.5">No critical warnings or fault conditions detected.</span>
            </div>
          ) : (
            alerts.map((item) => {
              const badge = getSeverityBadge(item.severity);
              const time = new Date(item.created_at).toLocaleTimeString();

              return (
                <div
                  key={item.id}
                  className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/70 flex items-start space-x-2.5 hover:border-slate-700 transition"
                >
                  <div className="mt-0.5 shrink-0">{badge.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${badge.bg}`}>
                        {item.event_type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{time}</span>
                    </div>
                    <p className="text-xs text-slate-200 mt-1 line-clamp-2 leading-snug">
                      {item.message}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800/60 flex items-center justify-between font-mono mt-3">
        <span>Channel: Socket.IO waterAlert</span>
        <span>Audited in PostgreSQL</span>
      </div>
    </article>
  );
};
