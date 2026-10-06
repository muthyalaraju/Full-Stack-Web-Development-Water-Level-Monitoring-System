import * as pumpService from '../services/pumpService.js';
import * as eventService from '../services/eventService.js';
import { publishMqttMessage } from '../mqtt/mqttClient.js';
import { MQTT_TOPICS } from '../mqtt/mqttTopics.js';
import { broadcastPumpStatus } from '../socket/socketService.js';
import { PUMP_STATUS, CONTROL_MODE } from '../utils/constants.js';

/**
 * GET /api/pump/status
 * Get current confirmed pump status and operating mode from PostgreSQL
 */
export const getPumpStatus = async (req, res, next) => {
  try {
    let status = null;
    try {
      status = await pumpService.getLatestPumpStatus(1);
    } catch (dbErr) {
      console.warn('[PumpController] DB read fallback:', dbErr.message);
    }

    if (!status) {
      return res.status(200).json({
        success: true,
        data: {
          tank_id: 1,
          status: PUMP_STATUS.OFF,
          control_mode: CONTROL_MODE.AUTO,
          reason: 'Initial system default state',
          created_at: new Date().toISOString(),
        },
      });
    }

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/pump/control
 * Dispatch pump control command (ON, OFF, AUTO)
 * Validates request, checks for conflicting redundant commands, and publishes to MQTT.
 * Does NOT prematurely claim pump is ON/OFF until ESP32 publishes confirmed state.
 */
export const controlPump = async (req, res, next) => {
  try {
    const { command, mode = 'MANUAL' } = req.body;
    const targetMode = command === 'AUTO' ? CONTROL_MODE.AUTO : mode;

    // 1. Fetch current confirmed status to prevent conflicting redundant commands
    let current = null;
    try {
      current = await pumpService.getLatestPumpStatus(1);
    } catch (dbErr) {
      console.warn('[PumpController] Skipping DB conflict check (DB offline/reconnecting):', dbErr.message);
    }

    if (current) {
      if (command === 'AUTO' && current.control_mode === CONTROL_MODE.AUTO) {
        return res.status(409).json({
          success: false,
          error: 'ConflictError',
          message: 'System is already configured in autonomous closed-loop (AUTO) mode.',
        });
      }

      if (command === 'ON' && current.status === PUMP_STATUS.ON && current.control_mode === CONTROL_MODE.MANUAL) {
        return res.status(409).json({
          success: false,
          error: 'ConflictError',
          message: 'Pump is already running in MANUAL mode.',
        });
      }

      if (command === 'OFF' && current.status === PUMP_STATUS.OFF && current.control_mode === CONTROL_MODE.MANUAL) {
        return res.status(409).json({
          success: false,
          error: 'ConflictError',
          message: 'Pump is already stopped in MANUAL mode.',
        });
      }
    }

    // 2. Publish MQTT command to ESP32 hardware on topic water/tank1/pump/command
    const mqttDispatched = publishMqttMessage(MQTT_TOPICS.PUMP_COMMAND, {
      command,
      mode: targetMode,
      timestamp: new Date().toISOString(),
    });

    // 3. Log user command intent in system_events (non-blocking)
    try {
      await eventService.logEvent({
        event_type: 'PUMP_COMMAND_DISPATCHED',
        message: `User dispatched pump command '${command}' (${targetMode}) via REST API. Dispatched to MQTT: ${mqttDispatched}`,
        severity: 'INFO',
      });
    } catch (e) {}

    // 4. Return response: State is PENDING physical confirmation from ESP32
    res.status(200).json({
      success: true,
      message: `Pump command '${command}' dispatched to MQTT broker. Awaiting ESP32 hardware relay confirmation.`,
      pendingConfirmation: true,
      command,
      mode: targetMode,
      mqttDispatched,
      currentConfirmedStatus: current,
    });
  } catch (error) {
    next(error);
  }
};
