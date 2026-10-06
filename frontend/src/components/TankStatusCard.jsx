import React from 'react';
import { Database, Gauge, Info, Layers } from 'lucide-react';
import { TANK_CONFIG, WATER_STATUS } from '../utils/constants';

export const TankStatusCard = ({ tank, reading }) => {
  const percent = reading?.water_level_percent || 0;
  const status = reading?.water_status || WATER_STATUS.NORMAL;
  const tankHeight = tank?.tank_height_cm || TANK_CONFIG.DEFAULT_HEIGHT_CM;
  const capacity = tank?.tank_capacity_liters || TANK_CONFIG.DEFAULT_CAPACITY_LITERS;

  // Approximate current volume in liters
  const currentVolume = ((capacity * percent) / 100).toFixed(2);

  const getStatusBadge = () => {
    switch (status) {
      case WATER_STATUS.LOW:
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-500',
          label: 'LOW WATER WARNING',
        };
      case WATER_STATUS.FULL:
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500',
          label: 'TANK FULL',
        };
      default:
        return {
          bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          dot: 'bg-cyan-400',
          label: 'NORMAL LEVEL',
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Tank Specifications</h2>
          </div>
          <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
            <span>{badge.label}</span>
          </span>
        </div>

        {/* Tank Parameters Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60">
            <span className="text-[11px] text-slate-400 uppercase font-medium">Monitored Unit</span>
            <p className="text-sm font-bold text-white mt-0.5 truncate">
              {tank?.tank_name || 'Prototype Tank 1'}
            </p>
            <p className="text-[11px] text-cyan-400 font-mono mt-1">Single-Tank Scope</p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60">
            <span className="text-[11px] text-slate-400 uppercase font-medium">Tank Height</span>
            <p className="text-sm font-bold text-white mt-0.5 font-mono">
              {tankHeight} <span className="text-xs font-normal text-slate-400">cm</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Bench Prototype</p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60">
            <span className="text-[11px] text-slate-400 uppercase font-medium">Gross Capacity</span>
            <p className="text-sm font-bold text-white mt-0.5 font-mono">
              {capacity} <span className="text-xs font-normal text-slate-400">Liters</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Calibrated Volume</p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60">
            <span className="text-[11px] text-slate-400 uppercase font-medium">Current Liquid</span>
            <p className="text-sm font-bold text-cyan-300 mt-0.5 font-mono">
              {currentVolume} <span className="text-xs font-normal text-slate-400">Liters</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Approx. Volume</p>
          </div>
        </div>
      </div>

      {/* Threshold Information Footer */}
      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/70 text-xs text-slate-400 flex items-start space-x-2">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-slate-300 font-medium">Calibrated Thresholds:</p>
          <p className="text-[11px] mt-0.5 text-slate-400">
            LOW: &le; 20% &middot; NORMAL: 21% &ndash; 80% &middot; FULL: &ge; 81%
          </p>
        </div>
      </div>
    </div>
  );
};
