import React from 'react';
import { Power, Cpu, ShieldCheck, CheckCircle2, CircleSlash } from 'lucide-react';
import { PUMP_STATE, CONTROL_MODE } from '../utils/constants';

export const PumpStatusCard = ({ pump }) => {
  const isPumpOn = pump?.status === PUMP_STATE.ON;
  const isAuto = pump?.control_mode === CONTROL_MODE.AUTO;

  return (
    <article
      className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between"
      aria-label="Pump Actuator Status Card"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Power className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-white">Pump Status</h2>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${
              isAuto
                ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}
          >
            {isAuto ? 'AUTO LOGIC' : 'MANUAL MODE'}
          </span>
        </div>

        {/* Primary Pump Status Display */}
        <div
          className={`flex items-center justify-between p-4 rounded-xl border mb-4 transition-all ${
            isPumpOn
              ? 'bg-emerald-950/30 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-950/70 border-slate-800/70'
          }`}
        >
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                isPumpOn
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-md shadow-emerald-500/20 animate-pulse'
                  : 'bg-slate-800/80 text-slate-400 border border-slate-700/80'
              }`}
            >
              <Power className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-medium">5V DC Submersible Pump</p>
              <p
                className={`text-2xl font-extrabold tracking-wide font-mono ${
                  isPumpOn ? 'text-emerald-400' : 'text-slate-300'
                }`}
              >
                PUMP {isPumpOn ? 'ON' : 'OFF'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Relay Pin GPIO 23</span>
            <span
              className={`text-xs font-mono font-bold inline-flex items-center space-x-1 ${
                isPumpOn ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {isPumpOn ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>CLOSED (ACTIVE)</span>
                </>
              ) : (
                <>
                  <CircleSlash className="w-3.5 h-3.5" />
                  <span>OPEN (INACTIVE)</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Transition Reason */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 mb-4">
          <span className="text-[11px] text-slate-400 uppercase font-medium block">Transition Reason</span>
          <p className="text-xs text-slate-200 mt-0.5 font-medium">
            {pump?.reason || 'System operating within calibrated nominal thresholds.'}
          </p>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="flex items-center space-x-2 text-[11px] text-slate-300 bg-slate-950/80 px-3 py-2.5 rounded-xl border border-slate-800/70">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          External 5V supply switched via 1-channel optocoupled relay (0% electrical load on ESP32).
        </span>
      </div>
    </article>
  );
};
