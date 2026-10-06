import mqtt from 'mqtt';
import { config } from '../config/config.js';
import { SUBSCRIPTION_TOPICS, MQTT_TOPICS } from './mqttTopics.js';
import { handleMqttMessage } from './messageHandler.js';

let client = null;
let connectionState = {
  status: 'DISCONNECTED',
  lastConnected: null,
  lastError: null,
  brokerUrl: config.mqtt.brokerUrl,
};

/**
 * Get current MQTT client status
 */
export const getMqttStatus = () => ({
  ...connectionState,
});

/**
 * Publish an outbound MQTT message (e.g. Pump Commands)
 * @param {string} topic 
 * @param {object} payload 
 */
export const publishMqttMessage = (topic, payload) => {
  if (!client || !client.connected) {
    console.warn(`[MQTT] Cannot publish to [${topic}]: Client is not connected.`);
    return false;
  }

  const messageString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  client.publish(topic, messageString, { qos: 1 }, (err) => {
    if (err) {
      console.error(`[MQTT Publish Error] Failed to publish to [${topic}]:`, err.message);
    } else {
      console.log(`[MQTT Published] [${topic}]: ${messageString}`);
    }
  });
  return true;
};

/**
 * Initialize and connect the MQTT subscriber client
 */
export const initMqttClient = () => {
  if (client) {
    return client;
  }

  const clientId = `water-backend-${Math.random().toString(16).substring(2, 8)}`;
  console.log(`[MQTT] Connecting to broker: ${config.mqtt.brokerUrl} (Client ID: ${clientId})...`);

  connectionState.status = 'CONNECTING';

  const options = {
    clientId,
    clean: true,
    connectTimeout: 20000,
    reconnectPeriod: 5000, // Auto-reconnect every 5 seconds
    ...(config.mqtt.username && { username: config.mqtt.username }),
    ...(config.mqtt.password && { password: config.mqtt.password }),
  };

  try {
    client = mqtt.connect(config.mqtt.brokerUrl, options);

    client.on('connect', () => {
      connectionState.status = 'CONNECTED';
      connectionState.lastConnected = new Date().toISOString();
      connectionState.lastError = null;
      console.log(`✅ [MQTT Connected] Broker: ${config.mqtt.brokerUrl}`);

      // Subscribe to all operational telemetry topics
      client.subscribe(SUBSCRIPTION_TOPICS, { qos: 1 }, (err, granted) => {
        if (err) {
          console.error('[MQTT Subscribe Error]:', err.message);
        } else {
          console.log(`📡 [MQTT Subscribed] Topics: ${granted.map((g) => g.topic).join(', ')}`);
        }
      });
    });

    client.on('message', (topic, message) => {
      handleMqttMessage(topic, message, publishMqttMessage);
    });

    client.on('reconnect', () => {
      connectionState.status = 'CONNECTING';
      console.log('[MQTT] Attempting to reconnect to broker...');
    });

    client.on('offline', () => {
      connectionState.status = 'DISCONNECTED';
      console.warn('[MQTT] Client is offline.');
    });

    client.on('error', (err) => {
      connectionState.status = 'ERROR';
      connectionState.lastError = err.message;
      console.error('[MQTT Client Error]:', err.message);
      // Do not rethrow; keep process alive and allow reconnection attempts
    });

    client.on('close', () => {
      if (connectionState.status !== 'ERROR') {
        connectionState.status = 'DISCONNECTED';
      }
    });
  } catch (error) {
    connectionState.status = 'ERROR';
    connectionState.lastError = error.message;
    console.error('[MQTT Initialization Error]:', error.message);
  }

  return client;
};

/**
 * Gracefully close MQTT client
 */
export const closeMqttClient = async () => {
  if (client) {
    return new Promise((resolve) => {
      client.end(false, {}, () => {
        console.log('[MQTT] Client disconnected cleanly.');
        resolve();
      });
    });
  }
};
