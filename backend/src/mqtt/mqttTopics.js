/**
 * MQTT Topic Definitions for Single-Tank Prototype (Tank 1)
 */

export const MQTT_TOPICS = {
  // ESP32 -> Backend
  SENSOR_READING: 'water/tank1/reading',
  PUMP_STATUS: 'water/tank1/pump/status',
  SYSTEM_STATUS: 'water/tank1/system/status',

  // Backend -> ESP32
  PUMP_COMMAND: 'water/tank1/pump/command',
};

export const SUBSCRIPTION_TOPICS = [
  MQTT_TOPICS.SENSOR_READING,
  MQTT_TOPICS.PUMP_STATUS,
  MQTT_TOPICS.SYSTEM_STATUS,
];

