import React from 'react';
import { History } from 'lucide-react';
import { WATER_STATUS } from '../utils/constants';

export const RecentReadings = ({ history = [], loading = false }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case WATER_STATUS.LOW:
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case WATER_STATUS.FULL:
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    }
  };

  return (
    <section
      className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between"
      aria-label="Recent Sensor Readings History"
    >
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/60 mb-4 gap-2">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">Recent Historical Readings</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Table: <code className="text-cyan-400">sensor_readings</code> (PostgreSQL)
          </span>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          {loading && history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs" role="status">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span>Fetching historical records from database...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              No historical sensor telemetry recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <caption className="sr-only">Recent historical sensor readings recorded in the database</caption>
              <thead className="bg-slate-950 text-slate-300 uppercase text-[10px] font-bold border-b border-slate-800 tracking-wider">
                <tr>
                  <th scope="col" className="py-3 px-3.5">Timestamp</th>
                  <th scope="col" className="py-3 px-3.5">Distance (Air Gap)</th>
                  <th scope="col" className="py-3 px-3.5">Water Column</th>
                  <th scope="col" className="py-3 px-3.5">Level (%)</th>
                  <th scope="col" className="py-3 px-3.5 text-right">State</th>
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
                    <tr
                      key={item.id || index}
                      className="hover:bg-slate-800/50 transition-colors focus-within:bg-slate-800/60"
                    >
                      <td className="py-2.5 px-3.5 text-slate-300 font-sans whitespace-nowrap">
                        {time}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-200 whitespace-nowrap">
                        {item.distance_cm} <span className="text-slate-400 text-[10px]">cm</span>
                      </td>
                      <td className="py-2.5 px-3.5 text-cyan-300 font-bold whitespace-nowrap">
                        {item.water_height_cm} <span className="text-slate-400 text-[10px] font-normal">cm</span>
                      </td>
                      <td className="py-2.5 px-3.5 font-extrabold text-white whitespace-nowrap">
                        {item.water_level_percent}%
                      </td>
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold font-sans uppercase tracking-wider border ${getStatusBadge(
                            item.water_status
                          )}`}
                        >
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

      <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800/60 flex items-center justify-between font-mono mt-3">
        <span>Showing latest 10 captured readings</span>
        <span>Order: Descending (Latest first)</span>
      </div>
    </section>
  );
};
