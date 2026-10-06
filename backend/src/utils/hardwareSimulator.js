/**
 * ESP32 Hardware Prototype Virtual Simulator
 * 
 * Accurately replicates the firmware behavior of `esp32/water_monitor.ino`:
 *  - Transmits HC-SR04 telemetry on `water/tank1/reading` every 2.5s
 *  - Subscribes to `water/tank1/pump/command`
 *  - Simulates physical relay actuation and publishes confirmation to `water/tank1/pump/status`
 *  - Dynamic liquid simulation: Level rises when pump is ON, slowly drains when pump is OFF
 *  - Enforces closed-loop AUTO hysteresis
 * 
 * Usage:
 *  node src/utils/hardwareSimulator.js
 */

import mqtt from 'mqtt';
import dotenv from 'dotenv';
dotenv.config();

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://broker.emqx.io:1883';
const TANK_HEIGHT_CM = 20.0;

let currentPercent = 45; // Start at nominal 45% level
let isPumpOn = false;
let isAutoMode = true;

console.log('===============================================================');
console.log('🤖 ESP32 Prototype Hardware Simulator Started');
console.log(`   Broker: ${BROKER_URL}`);
console.log('===============================================================');

const client = mqtt.connect(BROKER_URL, {
  clientId: `ESP32-Virtual-Sim-${Math.random().toString(16).slice(2, 6)}`,
  clean: true,
  will: {
    topic: 'water/tank1/system/status',
    payload: JSON.stringify({ status: 'OFFLINE', reason: 'Virtual ESP32 power down' }),
    qos: 1,
    retain: true,
  },
});

client.on('connect', () => {
  console.log('✅ [Virtual ESP32] Connected to Wi-Fi and MQTT broker.');

  // Announce system online
  client.publish(
    'water/tank1/system/status',
    JSON.stringify({ status: 'ONLINE', ip: '192.168.1.188', rssi: -58 }),
    { qos: 1, retain: true }
  );

  // Subscribe to pump commands
  client.subscribe('water/tank1/pump/command', { qos: 1 }, (err) => {
    if (!err) {
      console.log('📡 [Virtual ESP32] Subscribed to [water/tank1/pump/command]');
    }
  });

  // Announce initial confirmed pump state
  publishPumpStatus('Initial virtual hardware startup confirmation');
});

// Handle incoming commands from Node.js backend
client.on('message', (topic, message) => {
  if (topic === 'water/tank1/pump/command') {
    try {
      const payload = JSON.parse(message.toString());
      console.log('\n📩 [Virtual ESP32] Received Command from Backend:', payload);

      const { command, mode } = payload;

      if (command === 'AUTO') {
        isAutoMode = true;
        console.log('   🔄 Virtual relay restored to AUTONOMOUS CLOSED-LOOP mode.');
        publishPumpStatus('Autonomous closed-loop mode restored');
      } else if (command === 'ON') {
        isAutoMode = false;
        isPumpOn = true;
        console.log('   ⚡ Virtual Relay CLOSED (GPIO 23 active): 5V Pump turned ON manually.');
        publishPumpStatus('Manual user override: Relay closed, pump running');
      } else if (command === 'OFF') {
        isAutoMode = false;
        isPumpOn = false;
        console.log('   ⚡ Virtual Relay OPEN (GPIO 23 inactive): 5V Pump turned OFF manually.');
        publishPumpStatus('Manual user override: Relay opened, pump stopped');
      }
    } catch (e) {
      console.error('Failed to parse command payload:', e.message);
    }
  }
});

// Telemetry & Liquid Dynamics Loop (Every 2.5 seconds)
setInterval(() => {
  // 1. Simulate physical water physics
  if (isPumpOn) {
    // Water level rises while pump is active (+3% per tick)
    currentPercent = Math.min(100, currentPercent + 3);
  } else {
    // Water drains slowly (-1% per tick)
    currentPercent = Math.max(0, currentPercent - 1);
  }

  // 2. Ultrasonic HC-SR04 measurement math
  const waterHeight = Number(((TANK_HEIGHT_CM * currentPercent) / 100).toFixed(1));
  const distance = Number((TANK_HEIGHT_CM - waterHeight).toFixed(1));
  const waterStatus = currentPercent <= 20 ? 'LOW' : currentPercent >= 80 ? 'FULL' : 'NORMAL';

  // 3. Autonomous closed-loop logic with hysteresis
  if (isAutoMode) {
    if (currentPercent <= 20 && !isPumpOn) {
      isPumpOn = true;
      console.log(`\n🤖 [AUTO HYSTERESIS] Level is ${currentPercent}% (<=20%). Auto-activating virtual relay.`);
      publishPumpStatus(`Auto trigger: Water level dropped to ${currentPercent}%`);
    } else if (currentPercent >= 80 && isPumpOn) {
      isPumpOn = false;
      console.log(`\n🤖 [AUTO HYSTERESIS] Level is ${currentPercent}% (>=80%). Auto-deactivating virtual relay.`);
      publishPumpStatus(`Auto trigger: Tank reached capacity at ${currentPercent}%`);
    }
  }

  // 4. Publish reading payload to MQTT
  const readingPayload = {
    tankId: 1,
    distanceCm: distance,
    waterHeightCm: waterHeight,
    waterLevelPercent: currentPercent,
    waterStatus,
    timestamp: new Date().toISOString(),
  };

  client.publish('water/tank1/reading', JSON.stringify(readingPayload), { qos: 1 });
  console.log(
    `[Virtual ESP32 Telemetry] Level: ${currentPercent}% (${waterStatus}) | Height: ${waterHeight}cm | Gap: ${distance}cm | Pump: ${
      isPumpOn ? 'ON' : 'OFF'
    } [${isAutoMode ? 'AUTO' : 'MAN'}]`
  );
}, 2500);

function publishPumpStatus(reason) {
  const payload = {
    tankId: 1,
    status: isPumpOn ? 'ON' : 'OFF',
    controlMode: isAutoMode ? 'AUTO' : 'MANUAL',
    reason,
    timestamp: new Date().toISOString(),
  };
  client.publish('water/tank1/pump/status', JSON.stringify(payload), { qos: 1, retain: true });
}
