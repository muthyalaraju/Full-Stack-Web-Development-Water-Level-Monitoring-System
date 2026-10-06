import { saveSensorReading } from '../services/tankService.js';
import { getLatestPumpStatus, savePumpStatus } from '../services/pumpService.js';
import { logEvent } from '../services/eventService.js';
import { calculateWaterStatus, WATER_STATUS, PUMP_STATUS, EVENT_SEVERITY } from '../utils/constants.js';
import { MQTT_TOPICS } from './mqttTopics.js';

// Internal listeners registry (will bridge to Socket.IO when initialized)
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
  // Validate Tank ID (Must be 1 for single-tank prototype scope)
  const tankId = Number(payload.tankId ?? payload.tank_id ?? 1);
  if (tankId !== 1) {
    console.warn(`[MQTT Warning] Rejected telemetry for tankId: ${tankId}. Single-tank scope accepts tankId 1 only.`);
    return;
  }

  // Extract and validate numerical values
  const distanceCm = Number(payload.distanceCm ?? payload.distance_cm);
  const rawHeightCm = Number(payload.waterHeightCm ?? payload.water_height_cm);
  const rawPercent = Number(payload.waterLevelPercent ?? payload.water_level_percent);

  if (isNaN(distanceCm) || isNaN(rawHeightCm) || isNaN(rawPercent)) {
    console.warn('[MQTT Warning] Rejected telemetry with invalid numeric values:', payload);
    return;
  }

  // Sanitize and clamp values
  const clampedPercent = Math.min(100, Math.max(0, Math.round(rawPercent)));
  const waterHeightCm = Math.max(0, Number(rawHeightCm.toFixed(2)));
  const sanitizedDistance = Math.max(0, Number(distanceCm.toFixed(2)));

  // Validate or recalculate status
  const waterStatus = calculateWaterStatus(clampedPercent);

  // 5. Store reading in PostgreSQL
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

  // 6. Broadcast to registered listeners (Socket.IO prepared)
  readingListeners.forEach((fn) => fn(savedReading));

  // 7. Check Alerts & Closed-Loop Autonomous Pump Logic
  await evaluateThresholdsAndPump(savedReading, publishFn);
};

/**
 * Evaluates water level thresholds and triggers auto pump state transitions
 */
const evaluateThresholdsAndPump = async (reading, publishFn) => {
  const { water_level_percent, water_status } = reading;

  // Log Alert Events if entering LOW or FULL states
  if (water_status === WATER_STATUS.LOW) {
    const alert = {
      event_type: 'WATER_LOW_ALERT',
      message: `Tank water level reached ${water_level_percent}% (<= 20% LOW threshold).`,
      severity: EVENT_SEVERITY.CRITICAL,
    };
    await logEvent(alert);
    alertListeners.forEach((fn) => fn(alert));
  } else if (water_status === WATER_STATUS.FULL) {
    const alert = {
      event_type: 'TANK_FULL_ALERT',
      message: `Tank water level reached ${water_level_percent}% (>= 80% FULL threshold).`,
      severity: EVENT_SEVERITY.INFO,
    };
    await logEvent(alert);
    alertListeners.forEach((fn) => fn(alert));
  }

  // Automatic closed-loop pump control
  try {
    const currentPump = await getLatestPumpStatus(1);
    if (!currentPump || currentPump.control_mode !== 'AUTO') {
      return; // Do not override if user set MANUAL mode
    }

    if (water_level_percent <= 20 && currentPump.status !== PUMP_STATUS.ON) {
      // Auto Start Pump
      console.log(`[MQTT Auto-Logic] Water level is ${water_level_percent}% (<= 20%). Activating pump.`);
      const updated = await savePumpStatus({
        tank_id: 1,
        status: PUMP_STATUS.ON,
        control_mode: 'AUTO',
        reason: `Automatic trigger: Water level at ${water_level_percent}% (<= 20% LOW threshold)`,
      });

      if (publishFn) {
        publishFn(MQTT_TOPICS.PUMP_COMMAND, { command: 'ON', mode: 'AUTO' });
      }

      pumpListeners.forEach((fn) => fn(updated));
    } else if (water_level_percent >= 80 && currentPump.status !== PUMP_STATUS.OFF) {
      // Auto Stop Pump
      console.log(`[MQTT Auto-Logic] Water level is ${water_level_percent}% (>= 80%). Stopping pump.`);
      const updated = await savePumpStatus({
        tank_id: 1,
        status: PUMP_STATUS.OFF,
        control_mode: 'AUTO',
        reason: `Automatic trigger: Water level at ${water_level_percent}% (>= 80% FULL threshold)`,
      });

      if (publishFn) {
        publishFn(MQTT_TOPICS.PUMP_COMMAND, { command: 'OFF', mode: 'AUTO' });
      }

      pumpListeners.forEach((fn) => fn(updated));
    }
  } catch (err) {
    console.error('[MQTT Auto Pump Error]:', err.message);
  }
};

/**
 * Process Pump Status Feedback from ESP32
 */
const processPumpStatus = async (payload) => {
  const tankId = Number(payload.tankId ?? payload.tank_id ?? 1);
  if (tankId !== 1) return;

  const status = payload.status === 'ON' ? 'ON' : 'OFF';
  const controlMode = payload.controlMode === 'MANUAL' ? 'MANUAL' : 'AUTO';
  const reason = payload.reason || 'Hardware feedback confirmation from ESP32 relay';

  try {
    const saved = await savePumpStatus({
      tank_id: 1,
      status,
      control_mode: controlMode,
      reason,
    });
    console.log(`[MQTT Pump Feedback] Tank 1 Pump ${status} (${controlMode})`);
    pumpListeners.forEach((fn) => fn(saved));
  } catch (err) {
    console.error('[MQTT DB Error] Could not save pump feedback:', err.message);
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
