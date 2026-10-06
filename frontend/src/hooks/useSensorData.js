/**
 * Custom Hook: useSensorData
 * Centralized telemetry state manager for the Smart Water Level Monitoring Dashboard.
 * Handles data fetching, live state tracking, alerts, and prepares Socket.IO integration.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchTankInfo,
  fetchLatestReading,
  fetchReadingHistory,
  fetchPumpStatus,
  fetchSystemEvents,
  postPumpControl,
} from '../services/api';
import { calculateWaterStatus, WATER_STATUS } from '../utils/constants';

export const useSensorData = () => {
  const [tank, setTank] = useState(null);
  const [reading, setReading] = useState(null);
  const [history, setHistory] = useState([]);
  const [pump, setPump] = useState({
    status: 'OFF',
    control_mode: 'AUTO',
    reason: 'Initializing...',
    created_at: new Date().toISOString(),
  });
  const [alerts, setAlerts] = useState([]);
  const [connection, setConnection] = useState({
    backend: 'ONLINE',
    mqtt: 'CONNECTED',
    sensor: 'CONNECTED',
    database: 'CONNECTED',
    socket: 'CONNECTED',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Reference for socket connection cleanup (prepared for Socket.IO in Phase 3)
  const socketRef = useRef(null);

  /**
   * Initial data load
   */
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [tankData, latestReading, historyData, pumpData, eventsData] = await Promise.all([
        fetchTankInfo(),
        fetchLatestReading(),
        fetchReadingHistory(20),
        fetchPumpStatus(),
        fetchSystemEvents(10),
      ]);

      setTank(tankData);
      setReading(latestReading);
      setHistory(historyData);
      setPump(pumpData);
      setAlerts(eventsData);
    } catch (err) {
      console.error('Failed to load initial sensor data:', err);
      setError(err.message || 'Error connecting to data services');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Dispatch manual/auto pump control command
   */
  const controlPump = useCallback(async (command, mode = 'MANUAL') => {
    try {
      setActionLoading(true);
      const res = await postPumpControl(command, mode);

      if (res.status) {
        setPump(res.status);
      } else {
        setPump((prev) => ({
          ...prev,
          status: command === 'AUTO' ? prev.status : command,
          control_mode: mode,
          reason: `Manual control command (${command}) applied`,
          created_at: new Date().toISOString(),
        }));
      }

      // Add a system event log for the action
      setAlerts((prev) => [
        {
          id: Date.now(),
          event_type: 'PUMP_ACTION',
          message: `Pump control command '${command}' (${mode}) dispatched.`,
          severity: 'INFO',
          created_at: new Date().toISOString(),
        },
        ...prev.slice(0, 19),
      ]);

      return { success: true };
    } catch (err) {
      console.error('Pump control failed:', err);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, []);

  /**
   * In Phase 1 Dev Mock mode: Provide a gentle telemetry ticker to demonstrate live UI & charts
   */
  useEffect(() => {
    loadInitialData();

    // Dev mode demonstration ticker (simulates sensor publishing every 3.5 seconds)
    const interval = setInterval(() => {
      setReading((prev) => {
        if (!prev) return prev;

        // Slight simulated variation (-1% to +1%)
        const delta = (Math.random() - 0.48) * 1.5;
        const newPercent = Math.min(100, Math.max(5, Math.round(prev.water_level_percent + delta)));
        const tankHeight = 20.0;
        const newHeight = Number(((tankHeight * newPercent) / 100).toFixed(1));
        const newDistance = Number((tankHeight - newHeight).toFixed(1));
        const newStatus = calculateWaterStatus(newPercent);
        const now = new Date().toISOString();

        const updated = {
          ...prev,
          distance_cm: newDistance,
          water_height_cm: newHeight,
          water_level_percent: newPercent,
          water_status: newStatus,
          created_at: now,
        };

        // Append to rolling chart history
        setHistory((currHistory) => {
          const nextHistory = [...currHistory, updated];
          return nextHistory.slice(-25); // Keep last 25 readings
        });

        // Trigger auto pump if in AUTO mode and thresholds hit
        setPump((currPump) => {
          if (currPump.control_mode === 'AUTO') {
            if (newPercent <= 20 && currPump.status !== 'ON') {
              return {
                ...currPump,
                status: 'ON',
                reason: `Automatic trigger: Water level at ${newPercent}% (<= 20% LOW threshold)`,
                created_at: now,
              };
            } else if (newPercent >= 80 && currPump.status !== 'OFF') {
              return {
                ...currPump,
                status: 'OFF',
                reason: `Automatic trigger: Water level at ${newPercent}% (>= 80% FULL threshold)`,
                created_at: now,
              };
            }
          }
          return currPump;
        });

        return updated;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [loadInitialData]);

  return {
    tank,
    reading,
    history,
    pump,
    alerts,
    connection,
    loading,
    error,
    actionLoading,
    controlPump,
    refreshData: loadInitialData,
  };
};
