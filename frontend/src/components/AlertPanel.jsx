import React from 'react';
import { AlertTriangle, AlertCircle, Info, Bell, CheckCircle } from 'lucide-react';
import { ALERT_SEVERITY } from '../utils/constants';

export const AlertPanel = ({ alerts = [], reading }) => {
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case ALERT_SEVERITY.CRITICAL:
      case ALERT_SEVERITY.ERROR:
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-400" />,
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
        };
      case ALERT_SEVERITY.WARNING:
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
        };
      default:
        return {
          icon: <Info className="w-4 h-4 text-cyan-400" />,
          bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
        };
    }
  };

  // Derive dynamic real-time alert banner from latest sensor reading
  const activeWarning = (() => {
    if (!reading) return null;
    if (reading.water_level_percent <= 20) {
      return {
        title: 'CRITICAL: Water Level Low (&le; 20%)',
        desc: 'Tank water level is depleted. Pump is triggered or requires manual intervention.',
        severity: 'CRITICAL',
      };
    }
    if (reading.water_level_percent >= 80) {
      return {
        title: 'NOTICE: Tank Near Capacity (&ge; 80%)',
        desc: 'Tank is filled to safe maximum. Pump auto-stopped to prevent spillage.',
        severity: 'WARNING',
      };
    }
    return null;
  })();

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-white">System Events & Alerts</h2>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {alerts.length} events logged
          </span>
        </div>

        {/* Real-time Dynamic Banner (if water is LOW or FULL) */}
        {activeWarning && (
          <div className={`p-3.5 rounded-xl border mb-3 flex items-start space-x-3 ${
            activeWarning.severity === 'CRITICAL'
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-200'
          }`}>
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold">{activeWarning.title}</p>
              <p className="text-[11px] opacity-90 mt-0.5">{activeWarning.desc}</p>
            </div>
          </div>
        )}

        {/* Audit Log List */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs flex flex-col items-center">
              <CheckCircle className="w-8 h-8 text-slate-600 mb-2" />
              <span>No active warnings or audit logs.</span>
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
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${badge.bg}`}>
                        {item.event_type}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{time}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 truncate">{item.message}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-800/60 flex items-center justify-between">
        <span>Logged via PostgreSQL system_events</span>
        <span>Auto-refreshed</span>
      </div>
    </div>
  );
};
