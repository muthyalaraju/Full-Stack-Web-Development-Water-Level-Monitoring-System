import React from 'react';
import { WATER_STATUS } from '../utils/constants';

/**
 * Circular Radial Water Level Gauge Component
 * Accessible SVG radial progress gauge with status gradients and digital telemetry readout
 */
export const CircularGauge = ({
  percent = 0,
  heightCm = 0,
  distanceCm = 0,
  status = WATER_STATUS.NORMAL,
  size = 200,
}) => {
  const safePercent = Math.min(100, Math.max(0, Number(percent) || 0));

  // Gauge geometry
  const radius = 68;
  const strokeWidth = 12;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * safePercent) / 100;

  // Status-driven color palette
  const getPalette = () => {
    switch (status) {
      case WATER_STATUS.LOW:
        return {
          gradientId: 'radialGradientLow',
          startColor: '#f43f5e', // rose-500
          endColor: '#e11d48',   // rose-600
          glow: 'rgba(244, 63, 94, 0.35)',
          badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
          textColor: 'text-rose-400',
        };
      case WATER_STATUS.FULL:
        return {
          gradientId: 'radialGradientFull',
          startColor: '#10b981', // emerald-500
          endColor: '#059669',   // emerald-600
          glow: 'rgba(16, 185, 129, 0.35)',
          badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
          textColor: 'text-emerald-400',
        };
      default:
        return {
          gradientId: 'radialGradientNormal',
          startColor: '#06b6d4', // cyan-500
          endColor: '#2563eb',   // blue-600
          glow: 'rgba(6, 182, 212, 0.35)',
          badgeBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
          textColor: 'text-cyan-400',
        };
    }
  };

  const palette = getPalette();

  return (
    <div
      className="flex flex-col items-center justify-center p-2"
      role="meter"
      aria-valuenow={safePercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Water level circular gauge: ${safePercent} percent, status ${status}`}
    >
      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={palette.gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.startColor} />
              <stop offset="100%" stopColor={palette.endColor} />
            </linearGradient>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={palette.glow} />
            </filter>
          </defs>

          {/* Background Track Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#1e293b" // slate-800
            strokeWidth={strokeWidth}
            className="opacity-70"
          />

          {/* Calibrated Tick Marks (Every 25%) */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = (tick / 100) * 360 * (Math.PI / 180);
            const x1 = center + (radius - strokeWidth / 2 - 2) * Math.cos(angle);
            const y1 = center + (radius - strokeWidth / 2 - 2) * Math.sin(angle);
            const x2 = center + (radius + strokeWidth / 2 + 2) * Math.cos(angle);
            const y2 = center + (radius + strokeWidth / 2 + 2) * Math.sin(angle);
            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#334155" // slate-700
                strokeWidth="1.5"
              />
            );
          })}

          {/* Active Liquid Progress Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${palette.gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            filter="url(#gaugeGlow)"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Digital Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-4xl font-extrabold text-white font-mono tracking-tight">
            {safePercent}%
          </span>
          <span
            className={`mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${palette.badgeBg}`}
          >
            {status}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-1">
            {heightCm} cm liquid
          </span>
        </div>
      </div>

      {/* Sensor Calibration Reference */}
      <div className="mt-3 flex items-center justify-center space-x-3 text-xs font-mono text-slate-400">
        <span>Air Gap: <strong className="text-slate-200">{distanceCm} cm</strong></span>
        <span>&middot;</span>
        <span>Max: <strong className="text-slate-200">20.0 cm</strong></span>
      </div>
    </div>
  );
};

