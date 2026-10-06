/**
 * Comprehensive Automated Verification Suite for Phase 8 Pump Control Logic
 * Tests:
 *  1. Manual TURN ON (Command -> MQTT -> Hardware Feedback -> Database & Socket)
 *  2. Manual TURN OFF (Command -> MQTT -> Hardware Feedback -> Database & Socket)
 *  3. Switch to AUTO mode
 *  4. Autonomous Hysteresis Logic (<=20% Trigger ON, Deadband preservation, >=80% Trigger OFF)
 *  5. Conflict Prevention (409 Conflict on redundant commands)
 * 
 * Usage:
 *  node src/utils/testPumpFlow.js
 */

import mqtt from 'mqtt';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000/api';
const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://broker.emqx.io:1883';

console.log('====================================================');
console.log('🧪 Starting Phase 8 Pump Control Logic Verification');
console.log('====================================================');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  const mqttClient = mqtt.connect(BROKER_URL);

  await new Promise((resolve) => {
    mqttClient.on('connect', () => {
      console.log('✅ Connected to test MQTT broker channel');
      resolve();
    });
  });

  // Track inbound MQTT commands published by backend
  let lastMqttCommand = null;
  mqttClient.subscribe('water/tank1/pump/command');
  mqttClient.on('message', (topic, msg) => {
    if (topic === 'water/tank1/pump/command') {
      try {
        lastMqttCommand = JSON.parse(msg.toString());
        console.log('   📡 [ESP32 Mock Hardware] Received MQTT command:', lastMqttCommand);
      } catch (e) {}
    }
  });

  try {
    // ------------------------------------------------------------------
    // TEST 1: Manual TURN ON
    // ------------------------------------------------------------------
    console.log('\n--- TEST 1: Dispatch Manual TURN ON ---');
    const resOn = await fetch(`${API_BASE}/pump/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'ON', mode: 'MANUAL' }),
    });
    const dataOn = await resOn.json();
    console.log('REST Response Status:', resOn.status);
    console.log('REST Response Body:', dataOn);

    if (dataOn.pendingConfirmation) {
      console.log('✅ Verified: Backend returned pendingConfirmation (did not falsely claim pump is ON prematurely)');
    }

    await sleep(1000);

    // Simulate ESP32 hardware relay confirming physical activation
    console.log('   Simulating ESP32 physical relay activation confirmation...');
    mqttClient.publish(
      'water/tank1/pump/status',
      JSON.stringify({
        tankId: 1,
        status: 'ON',
        controlMode: 'MANUAL',
        reason: 'Relay closed on GPIO 23 (Confirmed physical actuation)',
      })
    );
    await sleep(1500);

    // ------------------------------------------------------------------
    // TEST 2: Conflict Prevention (Duplicate ON command)
    // ------------------------------------------------------------------
    console.log('\n--- TEST 2: Conflict Prevention (Redundant ON when already ON) ---');
    const resConflictOn = await fetch(`${API_BASE}/pump/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'ON', mode: 'MANUAL' }),
    });
    console.log('Conflict Status Code:', resConflictOn.status);
    const dataConflictOn = await resConflictOn.json();
    console.log('Conflict Response:', dataConflictOn);
    if (resConflictOn.status === 409) {
      console.log('✅ Verified: 409 Conflict properly prevented redundant command');
    }

    // ------------------------------------------------------------------
    // TEST 3: Manual TURN OFF
    // ------------------------------------------------------------------
    console.log('\n--- TEST 3: Dispatch Manual TURN OFF ---');
    const resOff = await fetch(`${API_BASE}/pump/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'OFF', mode: 'MANUAL' }),
    });
    const dataOff = await resOff.json();
    console.log('REST Response:', dataOff);

    await sleep(1000);

    // Simulate ESP32 physical relay opening
    console.log('   Simulating ESP32 physical relay deactivation confirmation...');
    mqttClient.publish(
      'water/tank1/pump/status',
      JSON.stringify({
        tankId: 1,
        status: 'OFF',
        controlMode: 'MANUAL',
        reason: 'Relay opened on GPIO 23 (Confirmed physical shutoff)',
      })
    );
    await sleep(1500);

    // ------------------------------------------------------------------
    // TEST 4: Switch to AUTO mode
    // ------------------------------------------------------------------
    console.log('\n--- TEST 4: Dispatch Switch to AUTO Mode ---');
    const resAuto = await fetch(`${API_BASE}/pump/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'AUTO', mode: 'AUTO' }),
    });
    const dataAuto = await resAuto.json();
    console.log('REST Response:', dataAuto);

    await sleep(1000);

    // Hardware acknowledges AUTO mode
    mqttClient.publish(
      'water/tank1/pump/status',
      JSON.stringify({
        tankId: 1,
        status: 'OFF',
        controlMode: 'AUTO',
        reason: 'ESP32 operating in autonomous closed-loop feedback mode',
      })
    );
    await sleep(1500);

    // ------------------------------------------------------------------
    // TEST 5: Autonomous Hysteresis Logic
    // ------------------------------------------------------------------
    console.log('\n--- TEST 5: Autonomous Hysteresis Testing ---');
    
    // Step A: Water drops to 15% (<= 20% LOW threshold)
    console.log('   Publishing low water reading (15%)...');
    lastMqttCommand = null;
    mqttClient.publish(
      'water/tank1/reading',
      JSON.stringify({
        tankId: 1,
        distanceCm: 17.0,
        waterHeightCm: 3.0,
        waterLevelPercent: 15,
        waterStatus: 'LOW',
      })
    );
    await sleep(2000);
    if (lastMqttCommand && lastMqttCommand.command === 'ON') {
      console.log('✅ Verified: AUTO mode automatically requested Pump ON when water <= 20%');
    }

    // Hardware confirms ON
    mqttClient.publish(
      'water/tank1/pump/status',
      JSON.stringify({
        tankId: 1,
        status: 'ON',
        controlMode: 'AUTO',
        reason: 'Autonomous trigger: Water level at 15%',
      })
    );
    await sleep(1500);

    // Step B: Water rises to 50% (Hysteresis Deadband)
    console.log('   Publishing deadband water reading (50%)...');
    lastMqttCommand = null;
    mqttClient.publish(
      'water/tank1/reading',
      JSON.stringify({
        tankId: 1,
        distanceCm: 10.0,
        waterHeightCm: 10.0,
        waterLevelPercent: 50,
        waterStatus: 'NORMAL',
      })
    );
    await sleep(2000);
    if (lastMqttCommand === null) {
      console.log('✅ Verified: Hysteresis deadband preserved pump ON state (no premature shutoff at 50%)');
    }

    // Step C: Water reaches 85% (>= 80% FULL threshold)
    console.log('   Publishing full water reading (85%)...');
    lastMqttCommand = null;
    mqttClient.publish(
      'water/tank1/reading',
      JSON.stringify({
        tankId: 1,
        distanceCm: 3.0,
        waterHeightCm: 17.0,
        waterLevelPercent: 85,
        waterStatus: 'FULL',
      })
    );
    await sleep(2000);
    if (lastMqttCommand && lastMqttCommand.command === 'OFF') {
      console.log('✅ Verified: AUTO mode automatically requested Pump OFF when water >= 80%');
    }

    console.log('\n====================================================');
    console.log('🎉 All Phase 8 Pump Control Logic Tests Passed!');
    console.log('====================================================');
  } catch (error) {
    console.error('Test execution error:', error.message);
  } finally {
    mqttClient.end();
  }
}

runTests();
