import * as pumpService from '../services/pumpService.js';
import * as eventService from '../services/eventService.js';
import { publishMqttMessage } from '../mqtt/mqttClient.js';
import { MQTT_TOPICS } from '../mqtt/mqttTopics.js';

/**
 * GET /api/pump/status
 * Get current pump status and operating mode
 */
export const getPumpStatus = async (req, res, next) => {
  try {
    const status = await pumpService.getLatestPumpStatus(1);
    if (!status) {
      return res.status(200).json({
        success: true,
        data: {
          tank_id: 1,
          status: 'OFF',
          control_mode: 'AUTO',
          reason: 'Initial default fallback state',
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
 */
export const controlPump = async (req, res, next) => {
  try {
    const { command, mode = 'MANUAL' } = req.body;

    // 1. Update database record
    const result = await pumpService.processPumpControlCommand(1, command, mode);

    // 2. Publish MQTT command to ESP32
    const mqttDispatched = publishMqttMessage(MQTT_TOPICS.PUMP_COMMAND, {
      command,
      mode: command === 'AUTO' ? 'AUTO' : mode,
    });

    // 3. Audit log the control action
    await eventService.logEvent({
      event_type: 'PUMP_COMMAND',
      message: `Pump control command '${command}' (${mode}) processed. MQTT dispatched: ${mqttDispatched}`,
      severity: 'INFO',
    });

    res.status(200).json({
      success: true,
      message: `Pump command '${command}' processed successfully.`,
      mqttDispatched,
      data: result.status,
    });
  } catch (error) {
    next(error);
  }
};
