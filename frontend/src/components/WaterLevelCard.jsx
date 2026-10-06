import React from 'react';
import { WaterLevelGauge } from './WaterLevelGauge';
import { Droplet, ArrowDownUp, Ruler, Clock, RefreshCw } from 'lucide-react';
import { WATER_STATUS } from '../utils/constants';

export const WaterLevelCard = ({ reading, loading, error, onRefresh }) => {
  if (loading && !reading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[380px] animate-pulse">
        <div className="w-12 h-12 rounded-full bg-slate-800 mb-4"></div>
        <div className="h-6 w-32 bg-slate-800 rounded mb-2"></div>
        <div className="h-4 w-48 bg-slate-800/60 rounded"></div>
      </div>
    );
  }

  if (error && !reading) {
    return (
      <div className="bg-slate-900 border border-rose-900/40 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[380px] text-center">
        <div className="w-12 h-12 rounded-full bg-rose-900/20 text-rose-400 flex items-center justify-center mb-4">
          <Droplet className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-rose-300 mb-1">Telemetry Unavailable</h3>
        <p className="text-xs text-slate-400 mb-4 max-w-xs">{error}</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const {
    water_level_percent = 0,
    water_height_cm = 0,
    distance_cm = 0,
    water_status = WATER_STATUS.NORMAL,
    created_at = new Date().toISOString(),
  } = reading || {};

  const formattedTime = new Date(created_at).toLocaleTimeString();

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-2">
        <div className="flex items-center space-x-2">
          <Droplet className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-semibold text-white">Water Level Status</h2>
        </div>
        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{formattedTime}</span>
        </div>
      </div>

      {/* Tank Gauge Visualization */}
      <WaterLevelGauge
        percent={water_level_percent}
        heightCm={water_height_cm}
        distanceCm={distance_cm}
        status={water_status}
      />

      {/* Metric Breakdown Grid */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/60">
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Ruler className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-medium">Water Height</p>
            <p className="text-sm sm:text-base font-bold text-white font-mono">
              {water_height_cm} <span className="text-xs text-slate-400 font-normal">cm</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <ArrowDownUp className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-medium">Sensor Distance</p>
            <p className="text-sm sm:text-base font-bold text-white font-mono">
              {distance_cm} <span className="text-xs text-slate-400 font-normal">cm</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
