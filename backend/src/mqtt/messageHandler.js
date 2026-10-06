import { saveSensorReading } from '../services/tankService.js';
import { getLatestPumpStatus, savePumpStatus } from '../services/pumpService.js';
import { logEvent } from '../services/eventService.js';
import { calculateWaterStatus, WATER_STATUS, PUMP_STATUS, EVENT_SEVERITY } from '../utils/constants.js';
import { MQTT_TOPICS } from './mqttTopics.js';
import { config } from '../config/config.js';

// Internal listeners registry (bridged to Socket.IO)
const readingListeners = new Set();
const pumpListeners = new Set();
const alertListeners = new Set();

export const registerReadingListener = (callback) => readingListeners.add(callback);
export const registerPumpListener = (callback) => pumpListeners.add(callback);
export const registerAlertListener = (callback) => alertListeners.add(callback);

/**
 * Handles incoming MQTT messages from subscribed topics
 * @param {string} topic 
 * @param {Buffer} messageBuffer 
 * @param {Function} publishFn - Function to publish outbound MQTT commands
 */
export const handleMqttMessage = async (topic, messageBuffer, publishFn) => {
  const rawString = messageBuffer.toString();

  // 1. Safe JSON Parsing
  let payload;
  try {
    payload = JSON.parse(rawString);
  } catch (err) {
    console.warn(`[MQTT] Ignored malformed JSON payload on topic [${topic}]: ${rawString}`);
    return;
  }

  // 2. Route by topic
  try {
    switch (topic) {
      case MQTT_TOPICS.SENSOR_READING:
        await processSensorReading(payload, publishFn);
        break;

      case MQTT_TOPICS.PUMP_STATUS:
        await processPumpStatus(payload);
        break;

      case MQTT_TOPICS.SYSTEM_STATUS:
        await processSystemStatus(payload);
        break;

      default:
        console.log(`[MQTT] Received message on unhandled topic: ${topic}`);
    }
  } catch (err) {
    console.error(`[MQTT Error] Failed processing message on [${topic}]:`, err.message);
  }
};

/**
 * Process HC-SR04 Sensor Telemetry
 */
const processSensorReading = async (payload, publishFn) => {
  const tankId = Number(payload.tankId ?? payload.tank_id ?? 1);
  if (tankId !== 1) {
    console.warn(`[MQTT Warning] Rejected telemetry for tankId: ${tankId}. Single-tank scope accepts tankId 1 only.`);
    return;
  }

  const distanceCm = Number(payload.distanceCm ?? payload.distance_cm);
  const rawHeightCm = Number(payload.waterHeightCm ?? payload.water_height_cm);
  const rawPercent = Number(payload.waterLevelPercent ?? payload.water_level_percent);

  if (isNaN(distanceCm) || isNaN(rawHeightCm) || isNaN(rawPercent)) {
    console.warn('[MQTT Warning] Rejected telemetry with invalid numeric values:', payload);
    return;
  }

  const clampedPercent = Math.min(100, Math.max(0, Math.round(rawPercent)));
  const waterHeightCm = Math.max(0, Number(rawHeightCm.toFixed(2)));
  const sanitizedDistance = Math.max(0, Number(distanceCm.toFixed(2)));
  const waterStatus = calculateWaterStatus(clampedPercent);

  // Store reading in PostgreSQL
  let savedReading;
  try {
    savedReading = await saveSensorReading({
      tank_id: 1,
      distance_cm: sanitizedDistance,
      water_height_cm: waterHeightCm,
      water_level_percent: clampedPercent,
      water_status: waterStatus,
    });
    console.log(`[MQTT Telemetry Saved] Tank 1: ${clampedPercent}% (${waterStatus}) | Distance: ${sanitizedDistance}cm`);
  } catch (dbErr) {
    console.error('[MQTT DB Error] Could not save sensor reading:', dbErr.message);
    return;
  }

  // Broadcast to registered listeners (Socket.IO)
  readingListeners.forEach((fn) => fn(savedReading));

  // Evaluate alerts and closed-loop pump logic with hysteresis
  await evaluateThresholdsAndPump(savedReading, publishFn);
};

/**
 * Evaluates water level thresholds and triggers auto pump state transitions with hysteresis
 */
const evaluateThresholdsAndPump = async (reading, publishFn) => {
  const { water_level_percent, water_status } = reading;
  const lowThreshold = config.tank.thresholds.low || 20;
  const fullThreshold = config.tank.thresholds.full || 80;

  // Log Alert Events if entering LOW or FULL states
  if (water_status === WATER_STATUS.LOW) {
    const alert = {
      event_type: 'WATER_LOW_ALERT',
      message: `Tank water level reached ${water_level_percent}% (<= ${lowThreshold}% LOW threshold).`,
      severity: EVENT_SEVERITY.CRITICAL,
    };
    await logEvent(alert);
    alertListeners.forEach((fn) => fn(alert));
  } else if (water_status === WATER_STATUS.FULL) {
    const alert = {
      event_type: 'TANK_FULL_ALERT',
      message: `Tank water level reached ${water_level_percent}% (>= ${fullThreshold}% FULL threshold).`,
      severity: EVENT_SEVERITY.INFO,
    };
    await logEvent(alert);
    alertListeners.forEach((fn) => fn(alert));
  }

  // Automatic closed-loop pump control (with hysteresis)
  try {
    const currentPump = await getLatestPumpStatus(1);
    if (!currentPump || currentPump.control_mode !== 'AUTO') {
      return; // Never override manual user control
    }

    // Hysteresis Rule 1: Water <= LOW_LEVEL (20%) -> Request Pump ON
    if (water_level_percent <= lowThreshold && currentPump.status !== PUMP_STATUS.ON) {
      console.log(`[MQTT Auto-Logic] Water level is ${water_level_percent}% (<= ${lowThreshold}%). Publishing pump ON command.`);
      
      if (publishFn) {
        publishFn(MQTT_TOPICS.PUMP_COMMAND, {
          command: 'ON',
          mode: 'AUTO',
          reason: `Auto-trigger: Water level at ${water_level_percent}% (<= ${lowThreshold}%)`,
        });
      }

      await logEvent({
        event_type: 'PUMP_AUTO_TRIGGER',
        message: `Autonomous logic requested Pump ON: Water level is ${water_level_percent}%.`,
        severity: EVENT_SEVERITY.INFO,
      });
    }
    // Hysteresis Rule 2: Water >= FULL_LEVEL (80%) -> Request Pump OFF
    else if (water_level_percent >= fullThreshold && currentPump.status !== PUMP_STATUS.OFF) {
      console.log(`[MQTT Auto-Logic] Water level is ${water_level_percent}% (>= ${fullThreshold}%). Publishing pump OFF command.`);
      
      if (publishFn) {
        publishFn(MQTT_TOPICS.PUMP_COMMAND, {
          command: 'OFF',
          mode: 'AUTO',
          reason: `Auto-trigger: Water level at ${water_level_percent}% (>= ${fullThreshold}%)`,
        });
      }

      await logEvent({
        event_type: 'PUMP_AUTO_TRIGGER',
        message: `Autonomous logic requested Pump OFF: Water level reached ${water_level_percent}%.`,
        severity: EVENT_SEVERITY.INFO,
      });
    }
    // Hysteresis Deadband (21% - 79%): Maintain existing state, no rapid ON/OFF cycling
  } catch (err) {
    console.error('[MQTT Auto Pump Error]:', err.message);
  }
};

/**
 * Process Pump Status Feedback from ESP32 Hardware
 * Confirmed physical relay state is recorded in PostgreSQL and broadcast to React
 */
const processPumpStatus = async (payload) => {
  const tankId = Number(payload.tankId ?? payload.tank_id ?? 1);
  if (tankId !== 1) return;

  const status = payload.status === 'ON' ? 'ON' : 'OFF';
  const controlMode = payload.controlMode === 'MANUAL' ? 'MANUAL' : 'AUTO';
  const reason = payload.reason || 'Hardware relay actuation confirmed by ESP32';

  try {
    const saved = await savePumpStatus({
      tank_id: 1,
      status,
      control_mode: controlMode,
      reason,
    });
    console.log(`✅ [ESP32 Hardware Confirmed] Tank 1 Pump: ${status} (${controlMode}) - ${reason}`);

    await logEvent({
      event_type: 'PUMP_STATUS_CONFIRMED',
      message: `ESP32 hardware confirmed relay state: ${status} (${controlMode}). Reason: ${reason}`,
      severity: EVENT_SEVERITY.INFO,
    });

    // Broadcast confirmed state to React dashboard via Socket.IO
    pumpListeners.forEach((fn) => fn(saved));
  } catch (err) {
    console.error('[MQTT DB Error] Could not save confirmed pump feedback:', err.message);
  }
};

/**
 * Process ESP32 Hardware Lifecycle / Heartbeat Status
 */
const processSystemStatus = async (payload) => {
  const status = payload.status || 'UNKNOWN';
  const message = payload.reason || `ESP32 reported system state: ${status}`;

  try {
    await logEvent({
      event_type: 'ESP32_SYSTEM',
      message,
      severity: status === 'ONLINE' ? EVENT_SEVERITY.INFO : EVENT_SEVERITY.WARNING,
    });
    console.log(`[MQTT ESP32 Status] ${status}: ${message}`);
  } catch (err) {
    console.error('[MQTT DB Error] Could not log system status:', err.message);
  }
};
