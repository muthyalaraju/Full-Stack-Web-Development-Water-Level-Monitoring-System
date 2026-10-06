/**
 * Custom Hook: useSensorData
 * Real-time telemetry hook connecting React to the Express REST API and Socket.IO.
 * Completely eliminates mock data and provides live updates without page refreshes.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchTankInfo,
  fetchLatestReading,
  fetchReadingHistory,
  fetchPumpStatus,
  fetchSystemEvents,
  fetchSystemHealth,
  postPumpControl,
} from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import { calculateWaterStatus, WATER_STATUS, PUMP_STATE, CONTROL_MODE } from '../utils/constants';

export const useSensorData = () => {
  const [tank, setTank] = useState(null);
  const [reading, setReading] = useState(null);
  const [history, setHistory] = useState([]);
  const [pump, setPump] = useState({
    status: PUMP_STATE.OFF,
    control_mode: CONTROL_MODE.AUTO,
    reason: 'Awaiting initial telemetry...',
    created_at: new Date().toISOString(),
  });
  const [alerts, setAlerts] = useState([]);
  const [connection, setConnection] = useState({
    backend: 'CONNECTING',
    mqtt: 'UNKNOWN',
    sensor: 'WAITING',
    database: 'CHECKING',
    socket: 'CONNECTING',
    isLive: false,
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  /**
   * 1. Load Initial Data from REST Endpoints on Mount
   */
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Probe health first
      const health = await fetchSystemHealth().catch(() => null);
      if (health) {
        setConnection((prev) => ({
          ...prev,
          backend: health.services?.backend || 'ONLINE',
          mqtt: health.services?.mqtt || 'CONNECTED',
          database: health.services?.database || 'CONNECTED',
        }));
      }

      // Parallel fetch of initial records
      const [tankData, latestReadingData, historyData, pumpData, eventsData] =
        await Promise.allSettled([
          fetchTankInfo(),
          fetchLatestReading(),
          fetchReadingHistory(30),
          fetchPumpStatus(),
          fetchSystemEvents(15),
        ]);

      if (tankData.status === 'fulfilled' && tankData.value) {
        setTank(tankData.value);
      }

      if (latestReadingData.status === 'fulfilled' && latestReadingData.value) {
        setReading(latestReadingData.value);
        setLastUpdated(latestReadingData.value.created_at || new Date().toISOString());
        setConnection((prev) => ({ ...prev, sensor: 'CONNECTED' }));
      } else {
        setConnection((prev) => ({ ...prev, sensor: 'AWAITING DATA' }));
      }

      if (historyData.status === 'fulfilled' && Array.isArray(historyData.value)) {
        setHistory(historyData.value);
      }

      if (pumpData.status === 'fulfilled' && pumpData.value) {
        setPump(pumpData.value);
      }

      if (eventsData.status === 'fulfilled' && Array.isArray(eventsData.value)) {
        setAlerts(eventsData.value);
      }

      setConnection((prev) => ({
        ...prev,
        backend: 'ONLINE',
      }));
    } catch (err) {
      console.error('Failed to load initial REST data:', err);
      setError('Unable to communicate with the monitoring backend. Ensure server is running.');
      setConnection((prev) => ({
        ...prev,
        backend: 'OFFLINE',
        isLive: false,
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 2. Dispatch Manual / Auto Pump Control Command
   */
  const controlPump = useCallback(async (command, mode = 'MANUAL') => {
    try {
      setActionLoading(true);
      const res = await postPumpControl(command, mode);

      if (res.data) {
        setPump(res.data);
      }

      // Prepend immediate event log
      setAlerts((prev) => [
        {
          id: Date.now(),
          event_type: 'PUMP_COMMAND',
          message: `Manual command '${command}' (${mode}) dispatched.`,
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
   * 3. Socket.IO Real-Time Stream Wiring
   */
  useEffect(() => {
    // Load baseline data from database
    loadInitialData();

    // Establish WebSocket stream
    const socket = connectSocket();

    socket.on('connect', () => {
      console.log('⚡ [Dashboard Socket.IO] Connected to backend stream:', socket.id);
      setConnection((prev) => ({
        ...prev,
        socket: 'CONNECTED',
        isLive: true,
        backend: 'ONLINE',
      }));
    });

    socket.on('connected', (data) => {
      console.log('⚡ [Dashboard Handshake]', data);
    });

    socket.on('disconnect', (reason) => {
      console.warn('⚡ [Dashboard Socket.IO] Disconnected:', reason);
      setConnection((prev) => ({
        ...prev,
        socket: 'DISCONNECTED',
        isLive: false,
      }));
    });

    socket.on('connect_error', (err) => {
      console.error('⚡ [Dashboard Socket.IO Error]:', err.message);
      setConnection((prev) => ({
        ...prev,
        socket: 'ERROR',
        isLive: false,
      }));
    });

    // Event: Incoming Validated Water Reading from ESP32
    socket.on('waterReading', (newReading) => {
      console.log('🌊 [Live Reading Received]:', newReading);

      setReading(newReading);
      setLastUpdated(newReading.created_at || new Date().toISOString());
      setConnection((prev) => ({
        ...prev,
        sensor: 'CONNECTED',
        isLive: true,
      }));

      // Append to rolling chart history (keep up to 35 latest readings)
      setHistory((prevHistory) => {
        const next = [...prevHistory, newReading];
        return next.slice(-35);
      });
    });

    // Event: Live Pump State Transition
    socket.on('pumpStatus', (newPumpStatus) => {
      console.log('⚡ [Live Pump Status Received]:', newPumpStatus);
      setPump(newPumpStatus);
    });

    // Event: Water Level Alert or Warning
    socket.on('waterAlert', (newAlert) => {
      console.warn('🚨 [Live Alert Received]:', newAlert);
      setAlerts((prevAlerts) => [
        {
          id: Date.now(),
          event_type: newAlert.event_type || 'ALERT',
          message: newAlert.message,
          severity: newAlert.severity || 'WARNING',
          created_at: new Date().toISOString(),
        },
        ...prevAlerts.slice(0, 19),
      ]);
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off('connect');
      socket.off('connected');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('waterReading');
      socket.off('pumpStatus');
      socket.off('waterAlert');
      disconnectSocket();
    };
  }, [loadInitialData]);

  return {
    tank,
    reading,
    history,
    pump,
    alerts,
    connection,
    lastUpdated,
    loading,
    error,
    actionLoading,
    controlPump,
    refreshData: loadInitialData,
  };
};
