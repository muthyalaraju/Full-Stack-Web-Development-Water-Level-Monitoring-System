# ESP32 Firmware Documentation

This folder contains the Arduino C++ code for the **ESP32 Dev Module** running the IoT Smart Water Level Monitor.

## Directory Files
- `water_monitor.ino`: Main firmware implementing HC-SR04 pulse reading, LCD display updates, MQTT publisher/subscriber, and relay control.
- `README.md`: This guide.

## Required Arduino IDE Libraries
Install via **Tools -> Manage Libraries...**:
1. **PubSubClient** by Nick O'Leary
2. **LiquidCrystal_I2C** by Frank de Brabander / Marco Schwartz
3. **ArduinoJson** by Benoit Blanchon (Version 6 or 7)

## Pin Assignments
- **HC-SR04 TRIG**: GPIO 5
- **HC-SR04 ECHO**: GPIO 18 (via 1kΩ / 2kΩ voltage divider)
- **Relay IN**: GPIO 23
- **LCD SDA**: GPIO 21
- **LCD SCL**: GPIO 22

For hardware schematics and electrical protection guidelines, see `../docs/hardware-connections.md`.
