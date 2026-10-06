import React from 'react';
import { Cpu, Radio, Zap, Monitor, Calculator } from 'lucide-react';

export const SensorDetails = ({ reading, tank }) => {
  const tankHeight = tank?.tank_height_cm || 20.0;
  const distance = reading?.distance_cm || 0;
  const waterHeight = reading?.water_height_cm || 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">Sensor Hardware & Math</h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
            HC-SR04 40kHz
          </span>
        </div>

        {/* Pin Connections Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 text-xs font-mono">
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/70">
            <span className="text-[10px] text-slate-500 uppercase block font-sans">Trigger Pin</span>
            <span className="text-cyan-400 font-bold">GPIO 5</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">10&mu;s pulse</span>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/70">
            <span className="text-[10px] text-slate-500 uppercase block font-sans">Echo Input</span>
            <span className="text-emerald-400 font-bold">GPIO 18</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">3.3V Divider</span>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/70">
            <span className="text-[10px] text-slate-500 uppercase block font-sans">Relay Signal</span>
            <span className="text-amber-400 font-bold">GPIO 23</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Isolated 5V</span>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/70">
            <span className="text-[10px] text-slate-500 uppercase block font-sans">16x2 LCD (I2C)</span>
            <span className="text-purple-400 font-bold">21 (SDA) / 22 (SCL)</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">0x27 / 0x3F</span>
          </div>
        </div>

        {/* Physics & Calculation Breakdown */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/70 space-y-2 mb-2 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <span>Mathematical Derivation (CO-2/IoT):</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 font-mono text-[11px] pt-1">
            <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] block">1. Distance from Echo:</span>
              <span>d = (343 m/s &times; &Delta;t) / 2</span>
              <span className="text-cyan-400 block text-[10px] mt-0.5">= {distance} cm</span>
            </div>
            
            <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] block">2. Water Column Height:</span>
              <span>H = H_tank - d</span>
              <span className="text-emerald-400 block text-[10px] mt-0.5">= {tankHeight} - {distance} = {waterHeight} cm</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2">
        <span>Hardware Architecture: ESP-WROOM-32</span>
        <span>Sampling: 3000 ms</span>
      </div>
    </div>
  );
};
