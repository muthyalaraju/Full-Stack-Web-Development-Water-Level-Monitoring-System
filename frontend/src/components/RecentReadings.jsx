import React from 'react';
import { History, ArrowUpDown, Filter } from 'lucide-react';
import { WATER_STATUS } from '../utils/constants';

export const RecentReadings = ({ history = [], loading = false }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case WATER_STATUS.LOW:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case WATER_STATUS.FULL:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/60 mb-4 gap-2">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">Recent Historical Readings</h2>
          </div>
          <span className="text-xs text-slate-400">
            Backed by PostgreSQL <code className="text-cyan-400 font-mono">sensor_readings</code>
          </span>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          {loading && history.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span>Fetching historical records...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              No historical sensor data recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Distance (cm)</th>
                  <th className="py-2.5 px-3">Height (cm)</th>
                  <th className="py-2.5 px-3">Level (%)</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {history.slice(-10).reverse().map((item, index) => {
                  const time = new Date(item.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr key={item.id || index} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 text-slate-300 font-sans">
                        {time}
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">
                        {item.distance_cm} cm
                      </td>
                      <td className="py-2.5 px-3 text-cyan-300">
                        {item.water_height_cm} cm
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">
                        {item.water_level_percent}%
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold font-sans border ${getStatusBadge(item.water_status)}`}>
                          {item.water_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-800/60 flex items-center justify-between">
        <span>Showing latest 10 captured records</span>
        <span>Order: Descending (Latest first)</span>
      </div>
    </div>
  );
};

