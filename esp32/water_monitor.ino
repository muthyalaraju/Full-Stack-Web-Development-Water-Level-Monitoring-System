/*
 * =========================================================================================
 * Project: IoT-Based Smart Water Level Monitoring and Management System
 * Target Hardware: ESP32 Dev Module (ESP-WROOM-32)
 * File: water_monitor.ino
 *
 * HARDWARE WIRING SPECIFICATION:
 *   - HC-SR04 TRIG : GPIO 12
 *   - HC-SR04 ECHO : GPIO 13 (Connect via voltage divider: 1k / 2k resistor to protect GPIO)
 *   - 5V Relay IN  : GPIO 14 (Switches external 5V DC pump power; Active LOW)
 *   - LED1 (Low)   : GPIO 2
 *   - LED2 (Medium): GPIO 4
 *   - LED3 (High)  : GPIO 5
 *   - LED4 (Full)  : GPIO 18
 *   - I2C LCD SDA  : GPIO 21
 *   - I2C LCD SCL  : GPIO 22
 * =========================================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

// -----------------------------------------------------------------------------------------
// 1. WI-FI & MQTT BROKER CONFIGURATION
// -----------------------------------------------------------------------------------------
// 2.4GHz Wi-Fi Credentials
const char* WIFI_SSID     = "";
const char* WIFI_PASSWORD = "";

// Public MQTT Broker (aligned with Backend server)
const char* MQTT_BROKER = "broker.hivemq.com";
const int   MQTT_PORT         = 1883;
// Direct IPv4 address fallback for mobile hotspots when DNS resolution fails
IPAddress   MQTT_BROKER_IP(44, 232, 241, 40);

// MQTT Topics matching our Node.js & React Full-Stack Architecture
const char* TOPIC_READING       = "water/tank1/reading";
const char* TOPIC_PUMP_COMMAND  = "water/tank1/pump/command";
const char* TOPIC_PUMP_STATUS   = "water/tank1/pump/status";
const char* TOPIC_SYSTEM_STATUS = "water/tank1/system/status";

// -----------------------------------------------------------------------------------------
// 2. PIN DEFINITIONS & TANK CALIBRATION
// -----------------------------------------------------------------------------------------
#define PIN_TRIG   12
#define PIN_ECHO   13
#define PIN_RELAY  14

#define PIN_LED1   2
#define PIN_LED2   4
#define PIN_LED3   5
#define PIN_LED4   18

#define PIN_SDA    21
#define PIN_SCL    22

// Relay configuration: standard 5V relay modules are active LOW
// (LOW = relay energizes / motor ON, HIGH = relay off / motor OFF)
#define RELAY_ON   LOW
#define RELAY_OFF  HIGH

// Tank Depth Calibration (in cm)
const float TANK_MAX_DEPTH_CM = 13.0; // Distance from sensor to empty tank bottom
const float LOW_THRESHOLD     = 20.0; // Auto-pump activation threshold (<= 20%)
const float FULL_THRESHOLD    = 80.0; // Auto-pump shutoff threshold (>= 80%)

// -----------------------------------------------------------------------------------------
// 3. OBJECT INSTANTIATION & STATE VARIABLES
// -----------------------------------------------------------------------------------------
LiquidCrystal_I2C lcd(0x27, 16, 2);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Operating states
bool isPumpOn        = false; // Current physical relay state
bool isAutoMode      = true;  // AUTO closed-loop vs MANUAL override mode
String currentStatus = "NORMAL";
float currentWaterPercent = 0.0;

// Timing intervals (Non-blocking design)
unsigned long lastTelemetryTime   = 0;
const unsigned long TELEMETRY_INTERVAL = 2500; // 2.5 seconds
unsigned long lastMqttRetry       = 0;
const unsigned long MQTT_RETRY_INTERVAL = 4000; // Retry every 4 seconds
unsigned long lastRelayToggleTime = 0;
const unsigned long RELAY_DEBOUNCE_MS  = 3000; // 3 seconds debounce

bool useDirectIP = false; // Toggles to direct IP if hostname DNS fails

// -------------------------------------------------------------------------
// 4. FUNCTION DECLARATIONS
// -------------------------------------------------------------------------
void setupWiFi();
void reconnectMQTT();
void mqttCallback(char* topic, byte* message, unsigned int length);
float readUltrasonicDistance();
void updateLEDs(float percentage);
void updateLCD(float levelPercent);
void setPumpState(bool turnOn, const String& reason);
void publishTelemetry(float distanceCm, float waterHeightCm, float levelPercent, const String& status);
void publishPumpStatus(const String& reason);

// -------------------------------------------------------------------------
// 5. SETUP
// -------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(400);

  Serial.println("\n=======================================================");
  Serial.println("🚀 Smart Water Level Monitoring System - ESP32 Firmware");
  Serial.println("=======================================================");

  // Initialize hardware pins
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);

  pinMode(PIN_RELAY, OUTPUT);
  digitalWrite(PIN_RELAY, RELAY_OFF); // Guarantee motor is OFF on boot

  pinMode(PIN_LED1, OUTPUT);
  pinMode(PIN_LED2, OUTPUT);
  pinMode(PIN_LED3, OUTPUT);
  pinMode(PIN_LED4, OUTPUT);
  updateLEDs(0);

  // Initialize I2C LCD
  Wire.begin(PIN_SDA, PIN_SCL);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Smart Water IoT");
  lcd.setCursor(0, 1);
  lcd.print("System Loading..");
  delay(1000);

  // Setup Wi-Fi
  setupWiFi();

  // Setup MQTT buffer and timeouts
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(512);
  mqttClient.setSocketTimeout(5);
  mqttClient.setKeepAlive(60);

  // Configure broker
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);

  // Initial MQTT connection attempt
  reconnectMQTT();
}

// -------------------------------------------------------------------------
// 6. MAIN LOOP (Non-blocking)
// -------------------------------------------------------------------------
void loop() {
  unsigned long now = millis();

  // 1. Maintain Wi-Fi
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }

  // 2. Maintain MQTT non-blocking
  if (WiFi.status() == WL_CONNECTED) {
    if (!mqttClient.connected()) {
      if (now - lastMqttRetry >= MQTT_RETRY_INTERVAL) {
        lastMqttRetry = now;
        reconnectMQTT();
      }
    } else {
      mqttClient.loop();
    }
  }

  // 3. Ultrasonic Telemetry & Local Control Loop (Every 2.5 seconds)
  if (now - lastTelemetryTime >= TELEMETRY_INTERVAL) {
    lastTelemetryTime = now;

    // A. Read sensor
    float distanceCm = readUltrasonicDistance();

    if (distanceCm > 0) {
      // B. Compute water level
      float waterHeightCm = TANK_MAX_DEPTH_CM - distanceCm;
      if (waterHeightCm < 0) waterHeightCm = 0;
      if (waterHeightCm > TANK_MAX_DEPTH_CM) waterHeightCm = TANK_MAX_DEPTH_CM;

      float levelPercent = (waterHeightCm / TANK_MAX_DEPTH_CM) * 100.0;
      if (levelPercent > 100.0) levelPercent = 100.0;
      if (levelPercent < 0.0) levelPercent = 0.0;
      currentWaterPercent = levelPercent;

      // C. Determine Status
      if (levelPercent <= LOW_THRESHOLD) {
        currentStatus = "LOW";
      } else if (levelPercent >= FULL_THRESHOLD) {
        currentStatus = "FULL";
      } else {
        currentStatus = "NORMAL";
      }

      // D. Autonomous Pump Control with Hysteresis (AUTO mode)
      if (isAutoMode) {
        if (levelPercent <= LOW_THRESHOLD && !isPumpOn) {
          Serial.printf("\n[AUTO] Level is %.1f%% (<= %.0f%%). Turning motor ON.\n", levelPercent, LOW_THRESHOLD);
          setPumpState(true, "AUTO_TRIGGER_LOW_LEVEL");
        } else if (levelPercent >= FULL_THRESHOLD && isPumpOn) {
          Serial.printf("\n[AUTO] Level is %.1f%% (>= %.0f%%). Turning motor OFF.\n", levelPercent, FULL_THRESHOLD);
          setPumpState(false, "AUTO_TRIGGER_FULL_TANK");
        }
      }

      // E. Update Hardware LEDs & LCD Display
      updateLEDs(levelPercent);
      updateLCD(levelPercent);

      // F. Publish to MQTT if connected
      if (mqttClient.connected()) {
        publishTelemetry(distanceCm, waterHeightCm, levelPercent, currentStatus);
      }

      Serial.printf("[Sensor] Level: %.1f%% (%s) | AirGap: %.1fcm | Motor: %s [%s] | MQTT: %s\n",
        levelPercent, currentStatus.c_str(), distanceCm,
        isPumpOn ? "ON" : "OFF", isAutoMode ? "AUTO" : "MANUAL",
        mqttClient.connected() ? "ONLINE" : "RECONNECTING");
    } else {
      Serial.println("⚠️ [Sensor] Echo timeout / sensor out of range.");
      updateLCD(currentWaterPercent);
    }
  }
}

// -------------------------------------------------------------------------
// 7. WI-FI HANDLER WITH GOOGLE DNS INJECTION
// -------------------------------------------------------------------------
void setupWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi: Connecting");
  lcd.setCursor(0, 1);
  lcd.print("Please wait...  ");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(350);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    // Explicitly configure Google DNS (8.8.8.8) to fix mobile hotspot DNS lookup failures
    IPAddress dns1(8, 8, 8, 8);
    IPAddress dns2(1, 1, 1, 1);
    WiFi.config(WiFi.localIP(), WiFi.gatewayIP(), WiFi.subnetMask(), dns1, dns2);

    Serial.println("\n✅ Wi-Fi Connected!");
    Serial.print("   IP: ");
    Serial.println(WiFi.localIP());

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi: Connected!");
    lcd.setCursor(0, 1);
    lcd.print("IP: ");
    lcd.print(WiFi.localIP());
    delay(1000);
  } else {
    Serial.println("\n❌ Wi-Fi Failed. Retrying in background...");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi: Failed!   ");
    lcd.setCursor(0, 1);
    lcd.print("Check Hotspot   ");
  }
}

// -------------------------------------------------------------------------
// 8. ROBUST MQTT RECONNECT WITH DIRECT IP FALLBACK
// -------------------------------------------------------------------------
void reconnectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;

  Serial.print("Connecting MQTT to ");
  if (useDirectIP) {
    Serial.print(MQTT_BROKER_IP);
    mqttClient.setServer(MQTT_BROKER_IP, MQTT_PORT);
  } else {
    Serial.print(MQTT_BROKER);
    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  }
  Serial.print("... ");

  lcd.setCursor(0, 1);
  lcd.print("MQTT: Connecting");

  // Create unique client ID based on ESP32 chip MAC
  uint64_t chipid = ESP.getEfuseMac();
  char clientId[32];
  snprintf(clientId, sizeof(clientId), "ESP32-Tank1-%04X%08X", (uint16_t)(chipid >> 32), (uint32_t)chipid);

  if (mqttClient.connect(clientId)) {
    Serial.println("✅ CONNECTED!");

    lcd.setCursor(0, 1);
    lcd.print("MQTT: Connected ");
    delay(800);

    // Subscribe to pump commands from Dashboard
    mqttClient.subscribe(TOPIC_PUMP_COMMAND, 1);
    Serial.printf("📡 Subscribed to [%s]\n", TOPIC_PUMP_COMMAND);

    // Announce connected status
    StaticJsonDocument<128> onlineDoc;
    onlineDoc["tankId"] = 1;
    onlineDoc["status"] = "ONLINE";
    onlineDoc["ip"]     = WiFi.localIP().toString();
    char onlineBuffer[128];
    serializeJson(onlineDoc, onlineBuffer);
    mqttClient.publish(TOPIC_SYSTEM_STATUS, onlineBuffer, true);

    // Publish initial confirmed pump status
    publishPumpStatus("ESP32_MQTT_RECONNECTED");
  } else {
    int state = mqttClient.state();
    Serial.printf("FAILED (rc=%d).\n", state);

    lcd.setCursor(0, 1);
    if (state == -2) {
      lcd.print("MQTT: DNS Err -2");
      // Switch to direct IP for the next attempt if DNS resolution failed
      useDirectIP = true;
    } else if (state == -4) {
      lcd.print("MQTT: Timeout -4");
      useDirectIP = !useDirectIP;
    } else {
      char errBuf[17];
      snprintf(errBuf, sizeof(errBuf), "MQTT: Err rc=%-3d", state);
      lcd.print(errBuf);
    }
  }
}

// -------------------------------------------------------------------------
// 9. MQTT INCOMING COMMAND HANDLER
// -------------------------------------------------------------------------
void mqttCallback(char* topic, byte* message, unsigned int length) {
  if (String(topic) == TOPIC_PUMP_COMMAND) {
    char payload[length + 1];
    memcpy(payload, message, length);
    payload[length] = '\0';

    Serial.printf("\n📩 [Command Received] Topic: %s | Payload: %s\n", topic, payload);

    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      const char* command = doc["command"]; // "ON", "OFF", or "AUTO"

      if (strcmp(command, "AUTO") == 0) {
        isAutoMode = true;
        Serial.println("   🔄 Mode switched to: AUTONOMOUS CLOSED-LOOP");
        publishPumpStatus("MODE_CHANGED_TO_AUTO");
      } else if (strcmp(command, "ON") == 0) {
        isAutoMode = false;
        setPumpState(true, "MANUAL_USER_OVERRIDE_ON");
      } else if (strcmp(command, "OFF") == 0) {
        isAutoMode = false;
        setPumpState(false, "MANUAL_USER_OVERRIDE_OFF");
      }
      updateLCD(currentWaterPercent);
    } else {
      Serial.println("⚠️ Failed to parse JSON command payload.");
    }
  }
}

// -------------------------------------------------------------------------
// 10. ULTRASONIC SENSOR MEASUREMENT
// -------------------------------------------------------------------------
float readUltrasonicDistance() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(4);

  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  long duration = pulseIn(PIN_ECHO, HIGH, 30000);
  if (duration == 0) {
    return -1.0;
  }

  // Speed of sound: 343 m/s = 0.0343 cm/us
  float distanceCm = (duration * 0.0343) / 2.0;
  return distanceCm;
}

// -------------------------------------------------------------------------
// 11. HARDWARE ACTUATION & LOCAL OUTPUTS
// -------------------------------------------------------------------------
void setPumpState(bool turnOn, const String& reason) {
  unsigned long now = millis();
  if (now - lastRelayToggleTime < RELAY_DEBOUNCE_MS) {
    Serial.println("⏳ Relay debounce active. Command postponed.");
    return;
  }

  isPumpOn = turnOn;
  lastRelayToggleTime = now;

  if (isPumpOn) {
    digitalWrite(PIN_RELAY, RELAY_ON);
    Serial.println("⚡ [Relay] CLOSED (GPIO 14 LOW) -> Motor is ON");
  } else {
    digitalWrite(PIN_RELAY, RELAY_OFF);
    Serial.println("⚡ [Relay] OPEN (GPIO 14 HIGH) -> Motor is OFF");
  }

  if (mqttClient.connected()) {
    publishPumpStatus(reason);
  }
  updateLCD(currentWaterPercent);
}

void updateLEDs(float percentage) {
  digitalWrite(PIN_LED1, percentage >= 15.0 ? HIGH : LOW);
  digitalWrite(PIN_LED2, percentage >= 40.0 ? HIGH : LOW);
  digitalWrite(PIN_LED3, percentage >= 65.0 ? HIGH : LOW);
  digitalWrite(PIN_LED4, percentage >= 85.0 ? HIGH : LOW);
}

void updateLCD(float levelPercent) {
  // Line 1: Water Level Percentage and Status
  lcd.setCursor(0, 0);
  char line1[17];
  snprintf(line1, sizeof(line1), "Level:%3.0f%% [%-4s]", levelPercent,
    currentStatus == "LOW" ? "LOW" : currentStatus == "FULL" ? "FULL" : "NORM");
  lcd.print(line1);

  // Line 2: Motor State, Control Mode, and MQTT connection status
  lcd.setCursor(0, 1);
  char line2[17];
  const char* mqttTag = mqttClient.connected() ? "MQ:OK" : "MQ:ERR";
  snprintf(line2, sizeof(line2), "M:%-3s %-4s %s",
    isPumpOn ? "ON" : "OFF",
    isAutoMode ? "AUTO" : "MAN",
    mqttTag);
  lcd.print(line2);
}

// -------------------------------------------------------------------------
// 12. TELEMETRY & STATUS PUBLISHING TO BACKEND
// -------------------------------------------------------------------------
void publishTelemetry(float distanceCm, float waterHeightCm, float levelPercent, const String& status) {
  StaticJsonDocument<256> doc;
  doc["tankId"]            = 1;
  doc["distanceCm"]        = round(distanceCm * 10) / 10.0;
  doc["waterHeightCm"]     = round(waterHeightCm * 10) / 10.0;
  doc["waterLevelPercent"] = round(levelPercent * 10) / 10.0;
  doc["waterStatus"]       = status;
  doc["timestamp"]         = String(millis());

  char buffer[256];
  size_t bytes = serializeJson(doc, buffer);
  mqttClient.publish(TOPIC_READING, buffer, bytes);
}

void publishPumpStatus(const String& reason) {
  StaticJsonDocument<256> doc;
  doc["tankId"]      = 1;
  doc["status"]      = isPumpOn ? "ON" : "OFF";
  doc["controlMode"] = isAutoMode ? "AUTO" : "MANUAL";
  doc["reason"]      = reason;
  doc["timestamp"]   = String(millis());

  char buffer[256];
  size_t bytes = serializeJson(doc, buffer);
  mqttClient.publish(TOPIC_PUMP_STATUS, buffer, bytes);
}
