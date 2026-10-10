# Hardware Pin Configuration & Wiring Guide

## Critical Safety Rules
1. **NEVER power the 5V DC pump directly from any ESP32 GPIO or the 3.3V/VIN pins!** An inductive motor will draw high inrush currents, induce inductive kickback voltage spikes, and permanently destroy the ESP32 microcontroller.
2. **The 5V DC Pump must be powered by an EXTERNAL 5V DC power supply**, switched exclusively via the relay contacts (COM and NO).
3. **Common Ground**: All GND pins (ESP32 GND, External 5V Power Supply GND, Relay GND, HC-SR04 GND, LED GNDs) must be connected to a common ground reference.
4. **Logic Level Protection**: HC-SR04 ECHO output is 5V logic. ESP32 GPIO pins are strictly 3.3V tolerant. You **MUST** use a resistor voltage divider to step down the 5V ECHO pulse to $\approx 3.3\text{V}$.

---

## Pin Allocation Table (Configured in `esp32/water_monitor.ino`)

| Component | Pin / Terminal | ESP32 Pin / Destination | Logic / Power Specs | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **HC-SR04** | VCC | External 5V / Breadboard 5V rail | +5V DC | Ultrasonic transducer requires 5V |
| | GND | Common GND | 0V | Common Ground |
| | TRIG | **GPIO 12** | 3.3V output $\rightarrow$ 5V input | ESP32 triggers sonar pulses |
| | ECHO | **Voltage Divider Input** | 5V pulse $\rightarrow$ stepped down to 3.3V | Connects to **GPIO 13** via divider |
| **Relay (5V)** | VCC | External 5V / 5V rail | +5V DC | Relay coil power |
| | GND | Common GND | 0V | Common Ground |
| | IN | **GPIO 14** | 3.3V Control logic | Active LOW (`LOW` = ON, `HIGH` = OFF) |
| | COM | Pump External Power Supply (+5V) | +5V DC | Switched live rail |
| | NO | DC Water Pump (+) Terminal | +5V DC when energized | Normally Open contact |
| **LED 1 (Low)** | Anode (+) | **GPIO 2** (via 220Ω resistor) | 3.3V logic | Lights up when level $\ge 15\%$ |
| **LED 2 (Med)** | Anode (+) | **GPIO 4** (via 220Ω resistor) | 3.3V logic | Lights up when level $\ge 40\%$ |
| **LED 3 (High)**| Anode (+) | **GPIO 5** (via 220Ω resistor) | 3.3V logic | Lights up when level $\ge 65\%$ |
| **LED 4 (Full)**| Anode (+) | **GPIO 18** (via 220Ω resistor) | 3.3V logic | Lights up when level $\ge 85\%$ |
| **I2C LCD 16x2**| VCC | 5V rail | +5V DC | 5V provides optimal contrast |
| | GND | Common GND | 0V | Common Ground |
| | SDA | **GPIO 21** | I2C Data (3.3V pull-up) | Hardware I2C SDA |
| | SCL | **GPIO 22** | I2C Clock (3.3V pull-up) | Hardware I2C SCL |
| **DC Water Pump**| (+) Lead | Relay NO Terminal | +5V DC | Switched through relay |
| | (-) Lead | External Power Supply GND | 0V | Returns directly to external GND |

---

## HC-SR04 Echo Voltage Divider Circuit

The ultrasonic sensor outputs a 5V signal on the ECHO pin. A simple two-resistor voltage divider is required:

```
HC-SR04 ECHO (5V)
       │
       │
      ┌┴┐
      │ │  R1 = 1 kΩ (or 1.8 kΩ)
      └┬┘
       │
       ├─────────────────────> To ESP32 GPIO 13 (Measured: ~3.3V safe)
       │
      ┌┴┐
      │ │  R2 = 2 kΩ (or 3.3 kΩ)
      └┬┘
       │
       v
  Common GND
```

**Calculation:**
$$V_{\text{out}} = V_{\text{in}} \times \left(\frac{R_2}{R_1 + R_2}\right) = 5\text{V} \times \left(\frac{2000}{1000 + 2000}\right) = 5\text{V} \times 0.667 \approx 3.33\text{V}$$

---

## 5V Relay & External Pump Wiring

```
[ External 5V Power Supply (+) ] ────────> [ Relay COM Terminal ]
                                           [ Relay NO Terminal  ] ───> [ 5V DC Pump (+) ]
[ External 5V Power Supply (-) ] ──┬─────────────────────────────────> [ 5V DC Pump (-) ]
                                   │
                                   └───> [ ESP32 GND (Common GND) ]
```
- When GPIO 14 turns the relay ON (`LOW`), the internal switch bridges `COM` to `NO`, powering the pump.
- When GPIO 14 turns the relay OFF (`HIGH`), the circuit opens safely.
