import React, { useState } from 'react';
import { Play, Square, RotateCcw, AlertTriangle, CheckCircle2, Radio, Info } from 'lucide-react';
import { PUMP_STATE, CONTROL_MODE } from '../utils/constants';

export const PumpControl = ({ pump, onControl, loading }) => {
  const [feedback, setFeedback] = useState(null);

  const isPumpOn = pump?.status === PUMP_STATE.ON;
  const isAuto = pump?.control_mode === CONTROL_MODE.AUTO;

  const handleAction = async (command, mode) => {
    setFeedback({
      type: 'pending',
      message: `Command '${command}' (${mode}) dispatched to MQTT. Awaiting ESP32 hardware relay confirmation...`,
    });

    const result = await onControl(command, mode);

    if (!result.success) {
      setFeedback({
        type: 'error',
        message: result.error || 'Failed to dispatch pump control command.',
      });
    } else {
      setFeedback({
        type: 'dispatched',
        message: `Command '${command}' published to MQTT broker. Hardware confirmation pending...`,
      });
      // Auto-clear message after 5 seconds
      setTimeout(() => setFeedback(null), 5000);
    }
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
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Confirmed Mode:</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
              isAuto
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {pump?.control_mode || 'AUTO'}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-4">
          Dispatch commands to the ESP32 relay via MQTT. The dashboard strictly displays confirmed physical relay state.
        </p>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div className={`p-3 rounded-xl border mb-4 text-xs flex items-start space-x-2.5 transition-all ${
            feedback.type === 'error'
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              : feedback.type === 'pending'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
          }`}>
            <Radio className="w-4 h-4 shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1">
              <span className="font-semibold">{feedback.message}</span>
            </div>
          </div>
        )}

        {/* Action Buttons (Conflict Prevention Guarded) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* TURN ON */}
          <button
            onClick={() => handleAction('ON', 'MANUAL')}
            disabled={loading || (isPumpOn && !isAuto)}
            title={isPumpOn && !isAuto ? 'Pump is already running in MANUAL mode' : 'Turn pump ON manually'}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg ${
              isPumpOn && !isAuto
                ? 'bg-emerald-950/60 text-emerald-600 border border-emerald-900/50 cursor-not-allowed opacity-60'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-[0.98]'
            } disabled:cursor-not-allowed`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>TURN ON</span>
          </button>

          {/* TURN OFF */}
          <button
            onClick={() => handleAction('OFF', 'MANUAL')}
            disabled={loading || (!isPumpOn && !isAuto)}
            title={!isPumpOn && !isAuto ? 'Pump is already stopped in MANUAL mode' : 'Turn pump OFF manually'}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg ${
              !isPumpOn && !isAuto
                ? 'bg-rose-950/60 text-rose-600 border border-rose-900/50 cursor-not-allowed opacity-60'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20 active:scale-[0.98]'
            } disabled:cursor-not-allowed`}
          >
            <Square className="w-4 h-4 fill-current" />
            <span>TURN OFF</span>
          </button>

          {/* AUTO MODE */}
          <button
            onClick={() => handleAction('AUTO', 'AUTO')}
            disabled={loading || isAuto}
            title={isAuto ? 'System is already operating in AUTO mode' : 'Switch to autonomous closed-loop mode'}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg ${
              isAuto
                ? 'bg-blue-950/60 text-blue-600 border border-blue-900/50 cursor-not-allowed opacity-60'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 active:scale-[0.98]'
            } disabled:cursor-not-allowed`}
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>AUTO</span>
          </button>
        </div>
      </div>

      {/* Mode & Hysteresis Logic Details */}
      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/70 text-xs space-y-1.5">
        <div className="flex items-center space-x-2 text-slate-300 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Autonomous Closed-Loop Logic (Hysteresis Guarded):</span>
        </div>
        <ul className="text-[11px] text-slate-400 pl-5 list-disc space-y-0.5">
          <li><strong>Water Level &le; 20%:</strong> Automatically triggers relay ON to refill tank.</li>
          <li><strong>Water Level &ge; 80%:</strong> Automatically triggers relay OFF to prevent spillage.</li>
          <li><strong>Deadband (21% &ndash; 79%):</strong> Hysteresis retains current state to avoid rapid wear.</li>
        </ul>
      </div>
    </div>
  );
};
