# ESP32 Firmware Documentation & Flashing Guide

This directory contains the production firmware for the **ESP32 Dev Module (ESP-WROOM-32)** powering the **IoT-Based Smart Water Level Monitoring and Management System**.

---

## 1. Hardware Pin Connections

| Component | Pin / Terminal | ESP32 GPIO / Rail | Description |
| :--- | :--- | :--- | :--- |
| **HC-SR04** | VCC | +5V External Rail | Ultrasonic sensor power |
| | GND | Common GND | Ground reference |
| | TRIG | **GPIO 5** | Ultrasonic trigger pulse (10 &mu;s) |
| | ECHO | **GPIO 18 (via Divider)** | Echo pulse stepped down to 3.3V |
| **5V Relay** | VCC | +5V External Rail | Relay coil supply |
| | GND | Common GND | Ground reference |
| | IN | **GPIO 23** | Relay control signal (Active LOW) |
| | COM | +5V External Pump Power | Switched external live rail |
| | NO | DC Pump (+) Terminal | Normally Open contact |
| **I2C LCD 16x2** | VCC | +5V External Rail | Display power & contrast |
| | GND | Common GND | Ground reference |
| | SDA | **GPIO 21** | Hardware I2C Data line |
| | SCL | **GPIO 22** | Hardware I2C Clock line |
| **5V DC Pump** | (+) Lead | Relay NO Terminal | Switched +5V power |
| | (-) Lead | External Power Supply GND | Direct ground return |

---

## 2. Critical Electrical Safety Rules

> [!CAUTION]
> **NEVER connect the 5V DC pump directly to the ESP32!**
> The DC pump motor draws high inductive inrush current that will instantly destroy the ESP32 microcontroller. The pump must be powered exclusively by an **external 5V DC power source**, switched through the relay contacts (`COM` $\rightarrow$ `NO`).

> [!WARNING]
> **HC-SR04 ECHO Voltage Divider Required**:
> The HC-SR04 ECHO pin produces a 5V logic pulse. The ESP32 GPIO pins are strictly 3.3V-tolerant. You must connect a two-resistor voltage divider between the HC-SR04 ECHO pin and **GPIO 18**:
>
> $$V_{\text{out}} = 5\text{V} \times \left(\frac{2\text{ k}\Omega}{1\text{ k}\Omega + 2\text{ k}\Omega}\right) \approx 3.33\text{V}$$
>
> Connect ECHO $\rightarrow$ $1\text{ k}\Omega$ resistor $\rightarrow$ GPIO 18 $\rightarrow$ $2\text{ k}\Omega$ resistor $\rightarrow$ GND.

---

## 3. Required Arduino IDE Libraries

Install the following libraries via the Arduino IDE Library Manager (**Sketch $\rightarrow$ Include Library $\rightarrow$ Manage Libraries...**):

1. **PubSubClient** by Nick O'Leary (Version 2.8+)
2. **LiquidCrystal_I2C** by Frank de Brabander or Marco Schwartz (Version 1.1.2+)
3. **ArduinoJson** by Benoit Blanchon (Version 6.x or 7.x)

---

## 4. Configuration Steps in `water_monitor.ino`

Before uploading the sketch, open [water_monitor.ino](file:///c:/Users/muthy/OneDrive/Desktop/Water%20Level%20Monitoring%20Full%20Stack%20Web%20Development%20Project/esp32/water_monitor.ino) and update:

### 4.1 Wi-Fi Credentials
```cpp
const char* WIFI_SSID     = "YOUR_HOME_WIFI_2.4GHZ";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
```
*(Ensure you connect to a 2.4 GHz network, as ESP32 does not support 5 GHz Wi-Fi).*

### 4.2 MQTT Broker Host
```cpp
const char* MQTT_BROKER   = "broker.emqx.io"; // Or your PC local IP if running Mosquitto
const int   MQTT_PORT     = 1883;
```

### 4.3 Prototype Tank Height (Default: 20 cm)
```cpp
const float TANK_HEIGHT_CM = 20.0;
```

---

## 5. Arduino IDE Upload Procedure

1. Connect the ESP32 to your PC using a high-quality Micro-USB data cable.
2. In Arduino IDE, select:
   - **Tools $\rightarrow$ Board $\rightarrow$ ESP32 Arduino $\rightarrow$ ESP32 Dev Module**
   - **Tools $\rightarrow$ Port $\rightarrow$ COMx** (Select the port assigned to Silicon Labs CP210x or CH340)
   - **Tools $\rightarrow$ Upload Speed $\rightarrow$ 115200** (or 921600)
3. Click **Upload** (Ctrl + U).
   *(If the IDE displays `Connecting........_____.....`, press and hold the **BOOT** button on the ESP32 until the flashing progress percentage begins).*
4. Open the Serial Monitor (**Tools $\rightarrow$ Serial Monitor**) and set the baud rate to **115200**.

---

## 6. LCD Display Formatting

- **Line 1**: `Level:  72% [NORM]` (Displays real-time percentage and status category)
- **Line 2**: `Pump: OFF [AUTO]` (Displays relay status and control mode)

---

## 7. Troubleshooting Guide

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| **`[HC-SR04 Warning] Ultrasonic echo timeout`** | Loose wiring or echo voltage divider improperly grounded | Verify Trig on GPIO 5, Echo on GPIO 18, and ensure common ground across all rails. |
| **`[MQTT Failed] rc=-2`** | Broker host unreachable or Wi-Fi offline | Verify Wi-Fi IP in Serial Monitor. Test pinging broker or use public `broker.emqx.io`. |
| **LCD displays blank or black boxes** | Incorrect I2C address or contrast potentiometer | Turn the blue potentiometer on the back of the I2C backpack. If blank, try address `0x3F` instead of `0x27`. |
| **Relay is inverted (turns ON when it should be OFF)** | Relay module is Active HIGH instead of Active LOW | Change `#define RELAY_ACTIVE_LEVEL HIGH` and `#define RELAY_INACTIVE_LEVEL LOW` in `water_monitor.ino`. |
| **ESP32 reboots continuously** | Power brownout caused by powering the pump from the ESP32 | **Disconnect pump immediately!** Power pump exclusively from the external 5V adapter. |
