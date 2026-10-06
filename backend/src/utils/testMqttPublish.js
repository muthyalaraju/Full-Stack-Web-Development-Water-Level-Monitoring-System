/**
 * Standalone MQTT Test Publisher Utility
 * Use this script to publish test messages to verify MQTT subscriber ingestion.
 * 
 * Usage:
 *   node src/utils/testMqttPublish.js [reading | pump | status]
 */

import mqtt from 'mqtt';
import dotenv from 'dotenv';
dotenv.config();

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.emqx.io:1883';
const action = process.argv[2] || 'reading';

console.log(`Connecting to MQTT broker: ${brokerUrl}...`);
const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
  console.log(`Connected to broker. Triggering test action: [${action}]`);

  if (action === 'reading') {
    // 1. Publish Simulated HC-SR04 Sensor Reading
    const distance = 5.6;
    const height = 14.4;
    const percent = 72;
    const payload = {
      tankId: 1,
      distanceCm: distance,
      waterHeightCm: height,
      waterLevelPercent: percent,
      waterStatus: 'NORMAL',
      timestamp: new Date().toISOString(),
    };

    client.publish('water/tank1/reading', JSON.stringify(payload), { qos: 1 }, () => {
      console.log('✅ Published sensor reading to [water/tank1/reading]:', payload);
      client.end();
    });
  } else if (action === 'pump') {
    // 2. Publish Simulated Pump Status Confirmation
    const payload = {
      tankId: 1,
      status: 'ON',
      controlMode: 'MANUAL',
      reason: 'Physical relay actuated by ESP32',
      timestamp: new Date().toISOString(),
    };

    client.publish('water/tank1/pump/status', JSON.stringify(payload), { qos: 1 }, () => {
      console.log('✅ Published pump status to [water/tank1/pump/status]:', payload);
      client.end();
    });
  } else if (action === 'status') {
    // 3. Publish ESP32 System Heartbeat
    const payload = {
      status: 'ONLINE',
      reason: 'ESP32 connected to local Wi-Fi and MQTT',
      ip: '192.168.1.100',
    };

    client.publish('water/tank1/system/status', JSON.stringify(payload), { qos: 1 }, () => {
      console.log('✅ Published system status to [water/tank1/system/status]:', payload);
      client.end();
    });
  } else {
    console.error(`Unknown action: ${action}. Use: reading, pump, or status.`);
    client.end();
  }
});

client.on('error', (err) => {
  console.error('MQTT publish error:', err.message);
  client.end();
});
