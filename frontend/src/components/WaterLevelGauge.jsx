import React from 'react';
import { TANK_CONFIG, WATER_STATUS } from '../utils/constants';

export const WaterLevelGauge = ({ percent = 0, heightCm = 0, distanceCm = 0, status = 'NORMAL' }) => {
  const safePercent = Math.min(100, Math.max(0, percent || 0));

  // Determine color theme based on status
  const getColorClasses = () => {
    if (status === WATER_STATUS.LOW) {
      return {
        bg: 'from-rose-600/90 to-red-500/80',
        wave: 'bg-rose-500/40',
        glow: 'shadow-rose-500/20',
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      };
    }
    if (status === WATER_STATUS.FULL) {
      return {
        bg: 'from-emerald-600/90 to-teal-500/80',
        wave: 'bg-emerald-500/40',
        glow: 'shadow-emerald-500/20',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      };
    }
    return {
      bg: 'from-sky-600/90 to-cyan-500/80',
      wave: 'bg-cyan-500/40',
      glow: 'shadow-cyan-500/20',
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    };
  };

  const theme = getColorClasses();

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Visual Tank Container */}
      <div className="relative w-40 sm:w-44 h-64 sm:h-72 bg-slate-900/90 rounded-2xl border-4 border-slate-700/80 shadow-2xl overflow-hidden flex flex-col justify-end">
        {/* Metric Height Indicators (Ruler tick marks) */}
        <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-between py-2 text-[10px] text-slate-400 font-mono select-none z-20 pointer-events-none">
          <span className="flex items-center space-x-1">
            <span>20cm (Full)</span>
            <span className="w-2 h-0.5 bg-slate-600"></span>
          </span>
          <span className="flex items-center space-x-1">
            <span>15cm</span>
            <span className="w-1.5 h-0.5 bg-slate-700"></span>
          </span>
          <span className="flex items-center space-x-1">
            <span>10cm (50%)</span>
            <span className="w-2 h-0.5 bg-slate-600"></span>
          </span>
          <span className="flex items-center space-x-1">
            <span>5cm</span>
            <span className="w-1.5 h-0.5 bg-slate-700"></span>
          </span>
          <span className="flex items-center space-x-1">
            <span>0cm (Empty)</span>
            <span className="w-2 h-0.5 bg-slate-600"></span>
          </span>
        </div>

        {/* Ultrasonic Sensor Representation at the top lid */}
        <div className="absolute top-0 inset-x-0 h-4 bg-slate-800 border-b border-slate-700 flex items-center justify-center space-x-3 z-20">
          <div className="w-2 h-2 rounded-full bg-slate-500"></div>
          <div className="w-2 h-2 rounded-full bg-slate-500"></div>
        </div>

        {/* Dynamic Liquid Fill */}
        <div
          className={`w-full bg-gradient-to-t ${theme.bg} transition-all duration-700 ease-out relative`}
          style={{ height: `${safePercent}%` }}
        >
          {/* Surface Wave Effect */}
          <div className={`absolute -top-3 left-0 right-0 h-4 ${theme.wave} rounded-t-[50%] animate-wave blur-[1px]`}></div>
          
          {/* Subtle Internal Reflection */}
          <div className="absolute inset-y-0 left-2 w-2 bg-white/10 rounded-full blur-[1px]"></div>
        </div>

        {/* Central Water Level Percentage Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30">
          <div className="bg-slate-950/70 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/60 shadow-lg text-center">
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {safePercent}%
            </span>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-300">
              {status}
            </p>
          </div>
        </div>
      </div>

      {/* Sensor Air Gap Indicator */}
      <div className="mt-4 flex items-center justify-center space-x-4 text-xs font-mono text-slate-400">
        <div>
          <span className="text-slate-300 font-semibold">{heightCm} cm</span> water
        </div>
        <span>&middot;</span>
        <div>
          <span className="text-slate-300 font-semibold">{distanceCm} cm</span> gap
        </div>
      </div>
    </div>
  );
};

