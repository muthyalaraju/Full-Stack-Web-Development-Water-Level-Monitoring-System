import React from 'react';
import { Play, Square, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PUMP_STATE, CONTROL_MODE } from '../utils/constants';

export const PumpControl = ({ pump, onControl, loading }) => {
  const isPumpOn = pump?.status === PUMP_STATE.ON;
  const isAuto = pump?.control_mode === CONTROL_MODE.AUTO;

  const handleStart = () => {
    onControl('ON', 'MANUAL');
  };

  const handleStop = () => {
    onControl('OFF', 'MANUAL');
  };

  const handleAuto = () => {
    onControl('AUTO', 'AUTO');
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <RotateCcw className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">Pump Control Console</h2>
          </div>
          <span className="text-xs text-slate-400">
            Current: <strong className="text-white">{pump?.control_mode}</strong>
          </span>
        </div>

        <p className="text-xs text-slate-300 mb-4">
          Manage water pump operation manually or restore autonomous microcontroller closed-loop feedback control.
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* Start Pump Button */}
          <button
            onClick={handleStart}
            disabled={loading || (isPumpOn && !isAuto)}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg ${
              isPumpOn && !isAuto
                ? 'bg-emerald-600/40 text-emerald-300 cursor-not-allowed border border-emerald-500/50'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-[0.98]'
            } disabled:opacity-50`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Turn ON</span>
          </button>

          {/* Stop Pump Button */}
          <button
            onClick={handleStop}
            disabled={loading || (!isPumpOn && !isAuto)}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg ${
              !isPumpOn && !isAuto
                ? 'bg-rose-600/40 text-rose-300 cursor-not-allowed border border-rose-500/50'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20 active:scale-[0.98]'
            } disabled:opacity-50`}
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Turn OFF</span>
          </button>

          {/* Reset to Auto Button */}
          <button
            onClick={handleAuto}
            disabled={loading || isAuto}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg ${
              isAuto
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 active:scale-[0.98]'
            } disabled:opacity-50`}
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Enable AUTO</span>
          </button>
        </div>
      </div>

      {/* Mode Documentation Box */}
      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/70 text-xs space-y-1.5">
        <div className="flex items-center space-x-2 text-slate-300 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          <span>Automatic Logic Thresholds:</span>
        </div>
        <ul className="text-[11px] text-slate-400 pl-5 list-disc space-y-0.5">
          <li><strong>Water Level &le; 20%:</strong> Relay activates (Pump ON to fill tank)</li>
          <li><strong>Water Level &ge; 80%:</strong> Relay deactivates (Pump OFF to prevent overflow)</li>
        </ul>
      </div>
    </div>
  );
};

