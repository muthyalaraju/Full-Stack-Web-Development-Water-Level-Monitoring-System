import React from 'react';
import { Power, Cpu, ShieldCheck, AlertCircle } from 'lucide-react';
import { PUMP_STATE, CONTROL_MODE } from '../utils/constants';

export const PumpStatusCard = ({ pump }) => {
  const isPumpOn = pump?.status === PUMP_STATE.ON;
  const isAuto = pump?.control_mode === CONTROL_MODE.AUTO;

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Power className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-white">Pump Actuator State</h2>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
            isAuto
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            {isAuto ? 'AUTO LOGIC' : 'MANUAL OVERRIDE'}
          </span>
        </div>

        {/* Pump Status Display */}
        <div className="flex items-center justify-between bg-slate-950/70 p-4 rounded-xl border border-slate-800/70 mb-4">
          <div className="flex items-center space-x-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              isPumpOn
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/20 animate-pulse'
                : 'bg-slate-800/60 text-slate-400 border border-slate-700/60'
            }`}>
              <Power className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-medium">5V DC Pump Status</p>
              <p className={`text-xl font-extrabold tracking-wide ${
                isPumpOn ? 'text-emerald-400' : 'text-slate-300'
              }`}>
                PUMP {isPumpOn ? 'RUNNING (ON)' : 'STOPPED (OFF)'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-500 block">GPIO 23 Relay</span>
            <span className={`text-xs font-mono font-semibold ${isPumpOn ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isPumpOn ? 'RELAY CLOSED' : 'RELAY OPEN'}
            </span>
          </div>
        </div>

        {/* State Reason */}
        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 mb-4">
          <span className="text-[11px] text-slate-400 uppercase font-medium block">Transition Reason</span>
          <p className="text-xs text-slate-300 mt-0.5">
            {pump?.reason || 'System operating within nominal thresholds.'}
          </p>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800/60">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          External 5V supply isolated via 1-channel relay (0% load on ESP32 GPIO).
        </span>
      </div>
    </div>
  );
};
