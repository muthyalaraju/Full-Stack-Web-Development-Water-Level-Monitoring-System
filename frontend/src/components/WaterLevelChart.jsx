import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Activity, Clock, BarChart3, AlertCircle, RefreshCw, Radio, TrendingUp } from 'lucide-react';
import { fetchReadingsByRange } from '../services/api';

// Register Chart.js elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TIME_RANGES = [
  { id: 'live', label: 'Real-Time Stream', description: 'Live 35-sample rolling buffer' },
  { id: '1h', label: 'Last 1 Hour', hours: 1, description: 'PostgreSQL 60m query' },
  { id: '6h', label: 'Last 6 Hours', hours: 6, description: 'PostgreSQL 6h query' },
  { id: '24h', label: 'Last 24 Hours', hours: 24, description: 'PostgreSQL 24h query' },
];

export const WaterLevelChart = ({ history = [], loading: initialLoading = false }) => {
  const [selectedRange, setSelectedRange] = useState('live');
  const [rangeData, setRangeData] = useState([]);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangeError, setRangeError] = useState(null);

  /**
   * Fetch historical data when a specific time range filter is selected
   */
  const loadHistoricalRange = useCallback(async (rangeId) => {
    if (rangeId === 'live') {
      setRangeData([]);
      setRangeError(null);
      return;
    }

    const rangeConfig = TIME_RANGES.find((r) => r.id === rangeId);
    if (!rangeConfig || !rangeConfig.hours) return;

    try {
      setRangeLoading(true);
      setRangeError(null);

      const now = new Date();
      const from = new Date(now.getTime() - rangeConfig.hours * 60 * 60 * 1000).toISOString();
      const to = now.toISOString();

      const readings = await fetchReadingsByRange(from, to, 150);

      // Sort chronologically ascending for the X-axis
      const sorted = [...readings].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      setRangeData(sorted);
    } catch (err) {
      console.error('Failed to load historical range:', err);
      setRangeError(err.message || 'Error fetching historical range records');
    } finally {
      setRangeLoading(false);
    }
  }, []);

  // Handle range change
  const handleRangeSelect = (rangeId) => {
    setSelectedRange(rangeId);
    loadHistoricalRange(rangeId);
  };

  // Determine active dataset: live rolling history vs. historical query
  const activeReadings = selectedRange === 'live' ? history : rangeData;
  const isLoading = selectedRange === 'live' ? initialLoading && history.length === 0 : rangeLoading;

  // Compute statistical metrics for the active window
  const stats = useMemo(() => {
    if (!activeReadings || activeReadings.length === 0) return null;
    const values = activeReadings.map((r) => Number(r.water_level_percent) || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = Math.round(sum / values.length);
    return { min, max, avg, count: values.length };
  }, [activeReadings]);

  /**
   * Memoize Chart.js dataset to prevent redundant canvas repaints
   */
  const chartData = useMemo(() => {
    if (!activeReadings || activeReadings.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = activeReadings.map((item) => {
      const date = new Date(item.created_at);
      if (selectedRange === '24h' || selectedRange === '6h') {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    });

    const values = activeReadings.map((item) => Number(item.water_level_percent));

    return {
      labels,
      datasets: [
        {
          label: 'Water Level (%)',
          data: values,
          borderColor: '#06b6d4', // Cyan 500
          backgroundColor: (context) => {
            const ctx = context.chart?.ctx;
            if (!ctx) return 'rgba(6, 182, 212, 0.2)';
            const gradient = ctx.createLinearGradient(0, 0, 0, 260);
            gradient.addColorStop(0, 'rgba(6, 182, 212, 0.40)');
            gradient.addColorStop(1, 'rgba(6, 182, 212, 0.02)');
            return gradient;
          },
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          pointRadius: activeReadings.length > 50 ? 1 : 3.5,
          pointHoverRadius: 6,
          pointBackgroundColor: '#22d3ee',
          pointBorderColor: '#0f172a',
          pointBorderWidth: 2,
        },
      ],
    };
  }, [activeReadings, selectedRange]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: selectedRange === 'live' ? 300 : 600,
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 10 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          stepSize: 20,
          callback: (value) => `${value}%`,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#e2e8f0',
        bodyColor: '#38bdf8',
        borderColor: 'rgba(51, 65, 85, 0.8)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const index = context.dataIndex;
            const point = activeReadings[index];
            if (!point) return `Level: ${context.parsed.y}%`;
            return [
              `Water Level: ${context.parsed.y}%`,
              `Height: ${point.water_height_cm ?? 'N/A'} cm`,
              `Distance: ${point.distance_cm ?? 'N/A'} cm`,
              `Status: ${point.water_status ?? 'NORMAL'}`,
            ];
          },
        },
      },
    },
  };

  return (
    <section
      className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between"
      aria-label="Water Level Real-Time and Historical Chart"
    >
      {/* Header with Title & Time Range Filter Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/60 mb-4 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">
              {selectedRange === 'live' ? 'Real-Time Water-Level Chart' : 'Historical Analysis Chart'}
            </h2>
            {selectedRange === 'live' && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Streaming</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {TIME_RANGES.find((r) => r.id === selectedRange)?.description}
          </p>
        </div>

        {/* Time-Range Selector Buttons */}
        <div
          className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 space-x-1 self-start sm:self-auto"
          role="tablist"
          aria-label="Chart time range filters"
        >
          {TIME_RANGES.map((range) => {
            const isActive = selectedRange === range.id;
            return (
              <button
                key={range.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => handleRangeSelect(range.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
                aria-label={`Select ${range.label}`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Telemetry Statistics Quick Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 text-xs font-mono">
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase font-sans block">Min Level</span>
            <span className="text-slate-200 font-bold text-sm">{stats.min}%</span>
          </div>
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase font-sans block">Average Level</span>
            <span className="text-cyan-400 font-bold text-sm">{stats.avg}%</span>
          </div>
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase font-sans block">Max Level</span>
            <span className="text-emerald-400 font-bold text-sm">{stats.max}%</span>
          </div>
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase font-sans block">Data Points</span>
            <span className="text-indigo-400 font-bold text-sm">{stats.count}</span>
          </div>
        </div>
      )}

      {/* Chart Canvas Area */}
      <div className="h-64 sm:h-72 w-full relative">
        {/* Loading State */}
        {isLoading && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm z-20 text-slate-400"
            role="status"
            aria-label="Loading telemetry chart records"
          >
            <div className="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-xs">Loading telemetry records...</p>
          </div>
        )}

        {/* Error State */}
        {rangeError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-20" role="alert">
            <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
            <p className="text-xs font-semibold text-rose-300 mb-1">Failed to Load History</p>
            <p className="text-[11px] text-slate-400 max-w-xs mb-3">{rangeError}</p>
            <button
              onClick={() => loadHistoricalRange(selectedRange)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              aria-label="Retry query"
            >
              <RefreshCw className="w-3 h-3 text-cyan-400" />
              <span>Retry Query</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !rangeError && activeReadings.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-center p-4">
            <BarChart3 className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-300">No Telemetry In This Window</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              {selectedRange === 'live'
                ? 'Awaiting live stream packets from the ESP32 via MQTT.'
                : 'No historical database records found in the selected time range.'}
            </p>
          </div>
        ) : (
          !rangeError && <Line data={chartData} options={chartOptions} />
        )}
      </div>

      {/* Legend & Threshold Marks */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-0.5 bg-rose-500"></span>
            <span>Low Limit (&le; 20%)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-0.5 bg-cyan-500"></span>
            <span>Nominal (21% - 80%)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-0.5 bg-emerald-500"></span>
            <span>Full Limit (&ge; 81%)</span>
          </span>
        </div>
        <span className="text-slate-400 font-mono">
          {selectedRange === 'live'
            ? `Rolling live buffer: ${activeReadings.length} samples (bounded memory)`
            : `Historical query: ${activeReadings.length} records retrieved`}
        </span>
      </div>
    </section>
  );
};
