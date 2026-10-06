import React from 'react';
import { Waves, Terminal, ShieldAlert } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 mt-12 py-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Project Details */}
          <div className="flex items-center space-x-3 text-center md:text-left">
            <div className="h-8 w-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Waves className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-200">
                IoT-Based Smart Water Level Monitoring and Management System
              </p>
              <p className="text-[11px] text-slate-500">
                College Full Stack Web Development Capstone Project &middot; Single-Tank Prototype
              </p>
            </div>
          </div>

          {/* Academic Outcomes Summary */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 text-[10px]">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
              ESP32 + HC-SR04 + 5V Relay
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
              Node.js + Express
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
              MQTT Broker
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
              PostgreSQL
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
              React + Vite + Tailwind
            </span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <p>Strict safety adherence: 5V DC pump isolated via relay &middot; 3.3V logic voltage divider on GPIO 18.</p>
          <p>&copy; {new Date().getFullYear()} IoT Full Stack Web Development Project</p>
        </div>
      </div>
    </footer>
  );
};
