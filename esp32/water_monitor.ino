/*
 * =========================================================================================
 * Project: IoT-Based Smart Water Level Monitoring and Management System
 * Target Hardware: ESP32 Dev Module (ESP-WROOM-32)
 * File: water_monitor.ino
 *
 * SENSORS & ACTUATORS PIN CONFIGURATION:
 *   - HC-SR04 TRIG : GPIO 5
 *   - HC-SR04 ECHO : GPIO 18 (MUST connect through 1k/2k resistor voltage divider)
 *   - 5V Relay IN  : GPIO 23 (Controls external 5V DC pump power circuit)
 *   - I2C LCD SDA  : GPIO 21
 *   - I2C LCD SCL  : GPIO 22
 *
 * CRITICAL SAFETY RULES:
 *   1. NEVER power the 5V DC pump from ESP32 3.3V/VIN pins! External 5V supply required.
 *   2. The HC-SR04 ECHO pin outputs 5V. Stepped down to ~3.3V with a voltage divider.
 * =========================================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

// -----------------------------------------------------------------------------------------
// 1. NETWORK & MQTT CONFIGURATION
// -----------------------------------------------------------------------------------------
const char* WIFI_SSID     = "YOUR_WIFI_SSID";      // Replace with your 2.4GHz Wi-Fi SSID
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";  // Replace with your Wi-Fi Password

const char* MQTT_BROKER   = "broker.emqx.io";      // Default broker (or your local IP)
const int   MQTT_PORT     = 1883;
const char* MQTT_USER     = "";                    // Optional username
const char* MQTT_PASS     = "";                    // Optional password

// MQTT Topics
const char* TOPIC_READING       = "water/tank1/reading";
const char* TOPIC_PUMP_COMMAND  = "water/tank1/pump/command";
const char* TOPIC_PUMP_STATUS   = "water/tank1/pump/status";
const char* TOPIC_SYSTEM_STATUS = "water/tank1/system/status";

// -----------------------------------------------------------------------------------------
// 2. HARDWARE PIN DEFINITIONS & CONSTANTS
// -----------------------------------------------------------------------------------------
#define PIN_TRIG        5
#define PIN_ECHO        18
#define PIN_RELAY       23
#define PIN_SDA         21
#define PIN_SCL         22

// Standard 5V relay modules are active LOW.
// Set to LOW if relay activates on LOW, or HIGH if active HIGH.
#define RELAY_ACTIVE_LEVEL   LOW
#define RELAY_INACTIVE_LEVEL HIGH

// Prototype Tank Calibration Dimensions
const float TANK_HEIGHT_CM = 20.0; // Benchmark prototype tank height (20 cm)
const float LOW_THRESHOLD  = 20.0; // Low water alert and auto-fill threshold (%)
const float FULL_THRESHOLD = 80.0; // Full tank limit and auto-shutoff threshold (%)

// -----------------------------------------------------------------------------------------
// 3. GLOBAL OBJECTS & STATE VARIABLES
// -----------------------------------------------------------------------------------------
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// I2C LCD (Standard addresses are 0x27 or 0x3F)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// System State
bool  pumpIsOn       = false;
bool  isAutoMode     = true; // Starts in autonomous mode
float lastDistanceCm = 0.0;
float lastHeightCm   = 0.0;
int   lastPercent    = 0;
String lastStatus    = "NORMAL";

// Non-blocking Timers
unsigned long lastSensorPublishTime = 0;
const unsigned long SENSOR_INTERVAL = 2500; // Sample & publish every 2.5 seconds

unsigned long lastLcdUpdateTime     = 0;
const unsigned long LCD_INTERVAL    = 500;  // Refresh LCD every 500 ms

unsigned long lastMqttRetryTime     = 0;
const unsigned long MQTT_RETRY_INTERVAL = 5000;

// -----------------------------------------------------------------------------------------
// 4. FUNCTION DECLARATIONS
// -----------------------------------------------------------------------------------------
void setupWiFi();
void reconnectMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
float measureDistanceCm();
void updateLcd(int percent, bool pumpOn, bool autoMode);
void setPumpState(bool turnOn, const char* reason);
void publishSensorData(float distance, float height, int percent, const String& status);
void publishPumpStatus(const char* reason);

// =========================================================================================
// SETUP
// =========================================================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n========================================================");
  Serial.println("🚀 ESP32 Smart Water Level Monitor & Pump Controller");
  Serial.println("========================================================");

  // Configure Hardware Pins
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_RELAY, OUTPUT);

  // Initialize relay in safe OFF state
  digitalWrite(PIN_RELAY, RELAY_INACTIVE_LEVEL);
  pumpIsOn = false;

  // Initialize I2C LCD
  Wire.begin(PIN_SDA, PIN_SCL);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Smart Water IoT");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");

  // Connect to Wi-Fi
  setupWiFi();

  // Configure MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("System Ready");
  delay(1000);
}

// =========================================================================================
// MAIN LOOP (Non-blocking)
// =========================================================================================
void loop() {
  unsigned long currentMillis = millis();

  // 1. Maintain Wi-Fi and MQTT Connectivity
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }

  if (!mqttClient.connected()) {
    if (currentMillis - lastMqttRetryTime > MQTT_RETRY_INTERVAL) {
      lastMqttRetryTime = currentMillis;
      reconnectMQTT();
    }
  } else {
    mqttClient.loop();
  }

  // 2. Periodic Sensor Measurement & Closed-Loop Processing
  if (currentMillis - lastSensorPublishTime >= SENSOR_INTERVAL) {
    lastSensorPublishTime = currentMillis;

    float distance = measureDistanceCm();

    // Check for valid echo pulse
    if (distance > 0.0 && distance <= 100.0) {
      lastDistanceCm = distance;

      // Mathematical derivation: Water Height = Tank Height - Sensor Distance
      float height = TANK_HEIGHT_CM - distance;
      if (height < 0.0) height = 0.0;
      if (height > TANK_HEIGHT_CM) height = TANK_HEIGHT_CM;
      lastHeightCm = height;

      // Water Level Percentage (Clamped 0 - 100%)
      float percentRaw = (height / TANK_HEIGHT_CM) * 100.0;
      int percent = (int)constrain(round(percentRaw), 0, 100);
      lastPercent = percent;

      // Determine Status Category
      if (percent <= LOW_THRESHOLD) {
        lastStatus = "LOW";
      } else if (percent >= FULL_THRESHOLD) {
        lastStatus = "FULL";
      } else {
        lastStatus = "NORMAL";
      }

      // Serial Telemetry Log
      Serial.printf("[HC-SR04] Distance: %.1f cm | Height: %.1f cm | Level: %d%% (%s)\n",
                    distance, height, percent, lastStatus.c_str());

      // Closed-Loop Autonomous Pump Logic with Hysteresis
      if (isAutoMode) {
        if (percent <= LOW_THRESHOLD && !pumpIsOn) {
          Serial.printf("[AUTO LOGIC] Water level %d%% <= %.0f%%. Activating pump.\n", percent, LOW_THRESHOLD);
          setPumpState(true, "Auto trigger: Low water threshold reached");
        } else if (percent >= FULL_THRESHOLD && pumpIsOn) {
          Serial.printf("[AUTO LOGIC] Water level %d%% >= %.0f%%. Deactivating pump.\n", percent, FULL_THRESHOLD);
          setPumpState(false, "Auto trigger: Tank full threshold reached");
        }
      }

      // Publish Telemetry to MQTT
      if (mqttClient.connected()) {
        publishSensorData(distance, height, percent, lastStatus);
      }
    } else {
      Serial.println("[HC-SR04 Warning] Ultrasonic echo timeout or out of range reading.");
    }
  }

  // 3. Periodic LCD Display Update
  if (currentMillis - lastLcdUpdateTime >= LCD_INTERVAL) {
    lastLcdUpdateTime = currentMillis;
    updateLcd(lastPercent, pumpIsOn, isAutoMode);
  }
}

// =========================================================================================
// SENSOR & HARDWARE IMPLEMENTATION
// =========================================================================================

/**
 * Generates HC-SR04 ultrasonic pulse and measures echo flight duration
 * Speed of sound = 343 m/s = 0.0343 cm/microsecond
 */
float measureDistanceCm() {
  // Ensure clean trigger pulse
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  // Read echo pulse duration (timeout 30,000 us = ~5.1 meters max)
  long duration = pulseIn(PIN_ECHO, HIGH, 30000);

  if (duration == 0) {
    return -1.0; // Echo timeout
  }

  // Distance = (Duration * Speed of Sound) / 2
  float distance = (duration * 0.0343) / 2.0;
  return distance;
}

/**
 * Controls relay coil state and confirms state transition
 */
void setPumpState(bool turnOn, const char* reason) {
  if (pumpIsOn == turnOn) return; // Avoid redundant toggles

  pumpIsOn = turnOn;
  digitalWrite(PIN_RELAY, pumpIsOn ? RELAY_ACTIVE_LEVEL : RELAY_INACTIVE_LEVEL);

  Serial.printf("⚡ [RELAY %s] GPIO 23 set to %s. Reason: %s\n",
                pumpIsOn ? "CLOSED (ON)" : "OPEN (OFF)",
                pumpIsOn ? "ACTIVE" : "INACTIVE",
                reason);

  // Publish confirmed status to MQTT
  if (mqttClient.connected()) {
    publishPumpStatus(reason);
  }
}

/**
 * Updates 16x2 LCD display
 * Line 1: Water Level: XX%
 * Line 2: Pump: ON/OFF [AUTO/MAN]
 */
void updateLcd(int percent, bool pumpOn, bool autoMode) {
  lcd.setCursor(0, 0);
  lcd.printf("Level: %3d%% [%s]", percent, lastStatus.c_str());

  lcd.setCursor(0, 1);
  lcd.printf("Pump: %-3s [%s] ",
             pumpOn ? "ON" : "OFF",
             autoMode ? "AUTO" : "MAN ");
}

// =========================================================================================
// MQTT TELEMETRY & COMMANDS
// =========================================================================================

/**
 * Publishes structured JSON sensor reading to water/tank1/reading
 */
void publishSensorData(float distance, float height, int percent, const String& status) {
  StaticJsonDocument<256> doc;
  doc["tankId"]            = 1;
  doc["distanceCm"]        = round(distance * 10.0) / 10.0;
  doc["waterHeightCm"]     = round(height * 10.0) / 10.0;
  doc["waterLevelPercent"] = percent;
  doc["waterStatus"]       = status;
  doc["timestamp"]         = String(millis() / 1000) + "s uptime";

  char jsonBuffer[256];
  serializeJson(doc, jsonBuffer);

  mqttClient.publish(TOPIC_READING, jsonBuffer);
}

/**
 * Publishes confirmed pump status feedback to water/tank1/pump/status
 */
void publishPumpStatus(const char* reason) {
  StaticJsonDocument<256> doc;
  doc["tankId"]      = 1;
  doc["status"]      = pumpIsOn ? "ON" : "OFF";
  doc["controlMode"] = isAutoMode ? "AUTO" : "MANUAL";
  doc["reason"]      = reason;
  doc["timestamp"]   = String(millis() / 1000) + "s uptime";

  char jsonBuffer[256];
  serializeJson(doc, jsonBuffer);

  mqttClient.publish(TOPIC_PUMP_STATUS, jsonBuffer, true); // Retained message
  Serial.printf("📡 [MQTT Published] %s -> %s\n", TOPIC_PUMP_STATUS, jsonBuffer);
}

/**
 * Callback triggered when an MQTT message arrives on subscribed topics
 */
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  char message[length + 1];
  memcpy(message, payload, length);
  message[length] = '\0';

  Serial.printf("📩 [MQTT Received] [%s]: %s\n", topic, message);

  if (strcmp(topic, TOPIC_PUMP_COMMAND) == 0) {
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, message);

    if (error) {
      Serial.println("[MQTT Error] JSON parsing failed on command payload.");
      return;
    }

    const char* command = doc["command"]; // "ON", "OFF", or "AUTO"
    const char* mode    = doc["mode"];    // "MANUAL" or "AUTO"

    if (command == NULL) return;

    if (strcmp(command, "AUTO") == 0) {
      isAutoMode = true;
      Serial.println("🔄 [Mode Switched] AUTONOMOUS CLOSED-LOOP MODE ENABLED.");
      publishPumpStatus("Restored autonomous feedback control mode");
    } else if (strcmp(command, "ON") == 0) {
      isAutoMode = false; // Manual override disables auto-mode
      setPumpState(true, "Manual user override: Pump turned ON");
    } else if (strcmp(command, "OFF") == 0) {
      isAutoMode = false; // Manual override disables auto-mode
      setPumpState(false, "Manual user override: Pump turned OFF");
    }
  }
}

// =========================================================================================
// CONNECTIVITY & RECONNECT RESILIENCE
// =========================================================================================

void setupWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.printf("\n[Wi-Fi] Connecting to SSID: %s ", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n✅ [Wi-Fi Connected] IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n⚠️ [Wi-Fi] Connection pending. Will retry in loop.");
  }
}

void reconnectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;

  String clientId = "ESP32-WaterMonitor-" + String(random(0xffff), HEX);
  Serial.printf("[MQTT] Connecting to broker %s as %s...\n", MQTT_BROKER, clientId.c_str());

  // Set Last Will and Testament (LWT)
  const char* lwtPayload = "{\"status\":\"OFFLINE\",\"reason\":\"Microcontroller power loss\"}";

  bool connected = false;
  if (strlen(MQTT_USER) > 0) {
    connected = mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS,
                                   TOPIC_SYSTEM_STATUS, 1, true, lwtPayload);
  } else {
    connected = mqttClient.connect(clientId.c_str(),
                                   TOPIC_SYSTEM_STATUS, 1, true, lwtPayload);
  }

  if (connected) {
    Serial.println("✅ [MQTT Connected]");
    // Subscribe to pump control topic
    mqttClient.subscribe(TOPIC_PUMP_COMMAND);
    Serial.printf("📡 [MQTT Subscribed] %s\n", TOPIC_PUMP_COMMAND);

    // Publish Online Announcement
    StaticJsonDocument<128> doc;
    doc["status"] = "ONLINE";
    doc["ip"]     = WiFi.localIP().toString();
    doc["rssi"]   = WiFi.RSSI();
    char buffer[128];
    serializeJson(doc, buffer);
    mqttClient.publish(TOPIC_SYSTEM_STATUS, buffer, true);

    // Publish initial pump status confirmation
    publishPumpStatus("Initial startup state confirmed");
  } else {
    Serial.printf("⚠️ [MQTT Failed] rc=%d. Will retry in %lu ms\n",
                  mqttClient.state(), MQTT_RETRY_INTERVAL);
  }
}

