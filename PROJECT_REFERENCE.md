# OrbitX Drone Simulator — Complete Project Reference

> **Purpose:** End-to-end technical reference for the gesture-controlled drone simulation project. Covers hardware, firmware, signal pipeline, physics engine, and web stack — everything you need to answer any question about the project.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Hardware Layer — ESP32 + MPU6050 + LDR](#3-hardware-layer)
4. [Kalman Filter — Why and How](#4-kalman-filter)
5. [Bluetooth Serial Communication](#5-bluetooth-serial-communication)
6. [Python Bridge — gesture_simulation.py](#6-python-bridge)
7. [WebSocket Protocol](#7-websocket-protocol)
8. [React Simulator Stack](#8-react-simulator-stack)
9. [Drone Physics Engine](#9-drone-physics-engine)
10. [Flight State Machine](#10-flight-state-machine)
11. [RTL (Return-to-Launch) Autopilot](#11-rtl-return-to-launch-autopilot)
12. [Collision Detection](#12-collision-detection)
13. [HUD & Telemetry Display](#13-hud--telemetry-display)
14. [Mode Separation — Drone vs Simulator](#14-mode-separation)
15. [Gesture → Control Mapping](#15-gesture--control-mapping)
16. [Data Flow — End to End](#16-data-flow-end-to-end)
17. [Common Q&A](#17-common-qa)

---

## 1. Project Overview

**OrbitX** is a dual-mode drone platform:

| Mode | Hardware Used | Controlled By |
|------|--------------|---------------|
| **Physical Drone** | LiteWing ESP32 drone | `gesture_drone.py` → UDP → drone |
| **3D Simulator** | Browser (React + Three.js) | `gesture_simulation.py` → WebSocket → browser |

A hand-worn ESP32 wristband reads hand tilt (MPU6050 IMU) and grip state (LDR light sensor), and wirelessly controls whichever target is active. Both modes are **mutually exclusive** — run one script at a time.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 ESP32 Wristband (Hardware)               │
│                                                          │
│  MPU6050 (IMU)        LDR (Light Sensor)                 │
│  ├── Accel X,Y,Z      └── Analog read (pin 34)           │
│  └── Gyro  X,Y,Z          0 = dark (fist)               │
│                            1 = bright (hand open)        │
│                                                          │
│  Kalman Filter fuses Accel + Gyro → filteredX, filteredY │
│                                                          │
│  Sends via Bluetooth Serial:  "filteredX,filteredY,LDR"  │
└──────────────────────────┬──────────────────────────────┘
                           │ Bluetooth (ESP32_BT)
         ┌─────────────────▼──────────────────┐
         │         Laptop / PC                 │
         │                                     │
         │  ┌───────────────────────────────┐  │
         │  │  gesture_simulation.py        │  │  ← SIMULATOR MODE
         │  │  Reads BT serial              │  │
         │  │  WebSocket broadcast          │  │
         │  │  ws://localhost:8765          │  │
         │  └──────────────┬────────────────┘  │
         │                 │                   │
         │  ┌──────────────▼────────────────┐  │
         │  │  gesture_drone.py (original)  │  │  ← DRONE MODE
         │  │  Reads BT serial              │  │
         │  │  cf.commander.send_hover...   │  │
         │  │  UDP → 192.168.43.42          │  │
         │  └───────────────────────────────┘  │
         └─────────────────────────────────────┘
                           │ WebSocket (sim mode only)
         ┌─────────────────▼──────────────────┐
         │         Browser — React App         │
         │                                     │
         │  useGestureSocket.js                │
         │  └── connects ws://localhost:8765   │
         │  useDronePhysics.js                 │
         │  └── gesture → pitch/roll/throttle  │
         │  SimulatorScene.jsx (Three.js)      │
         │  └── 3D city + drone rendering      │
         │  HUD.jsx                            │
         │  └── telemetry + GESTURE ACTIVE     │
         └─────────────────────────────────────┘
```

---

## 3. Hardware Layer

### ESP32 Dev Module
- Acts as the gesture controller wristband
- Reads MPU6050 over I2C
- Reads LDR over analog pin 34
- Broadcasts data via Classic Bluetooth Serial (`BluetoothSerial.h`)
- Device name: **`ESP32_BT`**

### MPU6050 (IMU — Inertial Measurement Unit)
- 6-axis sensor: 3-axis Accelerometer + 3-axis Gyroscope
- Connected via I2C (SDA/SCL)
- Configured ranges:
  - Accelerometer: `±8G`
  - Gyroscope: `±500°/s`
  - Low-pass filter bandwidth: `10 Hz`
- **X-axis** = hand tilt left/right → maps to **Roll**
- **Y-axis** = hand tilt forward/back → maps to **Pitch**

### LDR (Light Dependent Resistor)
- Connected to analog pin 34
- Acts as a **trigger switch**:
  - `analogRead < 2000` → **dark** = fist closed → `trigger = 0` → **DISARMED**
  - `analogRead ≥ 2000` → **bright** = hand open → `trigger = 1` → **ARMED / FLYING**
- This is a natural, hardware-based arm/disarm mechanism

### Power
- 3.7V Li-Po battery
- Mounted on wrist using a strap

---

## 4. Kalman Filter

### Why Not Just Use the Raw Accelerometer?
| Sensor | Problem |
|--------|---------|
| Accelerometer alone | Noisy — vibration causes jitter |
| Gyroscope alone | Drifts over time (integrates error) |
| **Kalman Filter** | **Best of both** — combines short-term gyro accuracy with long-term accelerometer stability |

### How It Works (in the Arduino firmware)

```
State estimate:  angle  (orientation)
State bias:      bias   (gyroscope drift offset)

Each loop iteration:
  1. PREDICT:  angle += (gyro_rate - bias) × dt
  2. UPDATE:   compare predicted angle with accelerometer reading
               correct the angle toward the measurement,
               scaled by how much we trust each source
```

### Key Tuning Parameters (used in firmware)
```cpp
float q_angle   = 0.01;   // Process noise — how fast the true angle changes
float q_bias    = 0.01;   // How fast gyro drift changes
float r_measure = 0.01;   // How noisy the accelerometer is
```
- Lower `r_measure` = trust accelerometer more = faster but jittery
- Higher `r_measure` = trust gyro more = smoother but slower

### Output
```
filteredX → hand tilt left/right (range approx -10 to +10)
filteredY → hand tilt fwd/back   (range approx -10 to +10)
```

---

## 5. Bluetooth Serial Communication

### Protocol
- Classic Bluetooth (not BLE) via `BluetoothSerial.h`
- Baud rate: **9600**
- Data format sent from ESP32 every loop:

```
"filteredX,filteredY,trigger\n"
```

**Example lines:**
```
-2.34,0.87,1       ← hand open, tilted right-forward
0.02,-0.01,0       ← fist closed (disarmed)
4.80,-3.20,1       ← strong right tilt, slight back tilt
```

### On Mac (Python side)
```python
ser = serial.Serial("/dev/tty.ESP32_BT", baudrate=9600, timeout=1)
```

### On Windows (Python side)
```python
ser = serial.Serial("COM4", baudrate=9600, timeout=1)
```

### Parsing (in Python — identical in both scripts)
```python
values   = line.split(',')
clean_x  = values[0]          # filteredX string
clean_y  = values[1]          # filteredY string
trigger  = values[2].strip()  # "0" or "1"

gyroX = float(clean_x)
gyroY = float(clean_y)

vx = round(gyroX / 10.0, 1)   # Roll:  -1.0 to +1.0
vy = -round(gyroY / 10.0, 1)  # Pitch: -1.0 to +1.0 (inverted)
```

**Why divide by 10?** The MPU6050 outputs values roughly ±10. Dividing normalises them to ±1.0, matching the simulator's control range.

**Why invert Y?** The Y-axis of the MPU6050 faces opposite to the drone's forward direction. Inverting makes "tilt forward = fly forward" feel natural.

---

## 6. Python Bridge

### gesture_simulation.py — Architecture

```
main()
  │
  ├── _start_ws_thread()        ← launches WebSocket server in background thread
  │     └── asyncio event loop  ← handles all browser connections async
  │          └── _ws_handler()  ← adds/removes browser clients from _clients set
  │
  └── Serial read loop (blocking, runs on main thread)
        │
        ├── readline()          ← blocks until ESP32 sends a line
        ├── parse X, Y, trigger
        │
        ├── trigger == "0"  → _broadcast({ throttle:0, trigger:0, gesture:"FIST" })
        └── trigger == "1"  → compute vx, vy
                            → _broadcast({ pitch:vy, roll:vx, throttle:1, trigger:1 })
```

### Thread Safety
```python
# _broadcast() is called from the main thread
# but WebSocket sends happen on the asyncio event loop thread
# asyncio.run_coroutine_threadsafe() bridges them safely
asyncio.run_coroutine_threadsafe(client.send(msg), _ws_loop)
```

### Independence from Drone Script
- `gesture_simulation.py` has **zero** imports of cflib
- Does **not** connect to the LiteWing drone at all
- Only dependencies: `websockets`, `pyserial`, stdlib

---

## 7. WebSocket Protocol

### Server (Python)
- Library: `websockets` (asyncio-based)
- Address: `ws://localhost:8765`
- Protocol: text frames, JSON encoding

### Message Format (Python → Browser)
```json
{
  "pitch":    -0.4,
  "roll":      0.5,
  "throttle":  1,
  "trigger":   1,
  "gesture":  "X:+0.5  Y:-0.4"
}
```

| Field | Source | Meaning |
|-------|--------|---------|
| `pitch` | `vy = -gyroY/10` | Forward/back tilt. Positive = forward |
| `roll` | `vx = gyroX/10` | Left/right tilt. Positive = right |
| `throttle` | LDR trigger | `1` = hover active, `0` = cut power |
| `trigger` | LDR | `1` = hand open (armed), `0` = fist (disarmed) |
| `gesture` | formatted string | Display-only label shown in HUD |

### Client (React — useGestureSocket.js)
```javascript
const ws = new WebSocket('ws://localhost:8765');
ws.onmessage = (event) => {
  const cmd = JSON.parse(event.data);  // { pitch, roll, throttle, trigger, gesture }
  setGestureCmd(cmd);
};

// Auto-reconnect every 3 seconds if disconnected
ws.onclose = () => setTimeout(connect, 3000);
```

**Why auto-reconnect?** So the keyboard fallback keeps working even if the Python script isn't running. The browser never hard-fails — it just silently retries.

---

## 8. React Simulator Stack

### Technology
- **Vite** — build tool and dev server
- **React** — UI framework
- **React Three Fiber** — React wrapper for Three.js
- **Three.js** — 3D WebGL rendering
- **@react-three/drei** — helpers (Sky, Environment, BakeShadows)
- **Framer Motion** — HUD animations
- **React Router DOM** — navigation

### File Structure (simulator-specific)
```
src/simulator/
  ├── SimulatorScene.jsx    Root component — Canvas, city, drone, HUD
  ├── SimDrone.jsx          3D drone mesh (visual model)
  ├── useDronePhysics.js    Physics engine + gesture/keyboard input
  ├── useFollowCam.js       Camera that follows the drone smoothly
  ├── useKeyboard.js        Keyboard input state hook
  ├── useGestureSocket.js   WebSocket client hook (NEW)
  └── HUD.jsx               Overlay UI — telemetry, radar, buttons
```

### Rendering Pipeline
```
SimulatorScene
  └── <Canvas> (Three.js WebGL context)
        └── InteractiveScene
              ├── useDronePhysics()   ← physics + input
              ├── useFollowCam()      ← camera tracking
              ├── <Sky />             ← procedural skybox
              ├── <Environment />     ← PBR lighting
              ├── Ground plane mesh
              ├── Helipad group
              ├── <CityBlocks />      ← 150 InstancedMesh buildings
              └── <SimDrone />        ← drone model
  └── <HUD />   (absolutely positioned DOM overlay on top of canvas)
```

---

## 9. Drone Physics Engine

**File:** `src/simulator/useDronePhysics.js`

### Constants
```javascript
const MAX_THROTTLE = 20;          // Newtons of max thrust
const MAX_PITCH    = Math.PI / 3; // 60° max pitch angle
const MAX_ROLL     = Math.PI / 3; // 60° max roll angle
const GRAVITY      = -9.81;       // m/s² (Earth gravity)
```

### Rotation Order
```javascript
droneRef.current.rotation.order = 'YXZ';
// Y = Yaw first (heading), X = Pitch, Z = Roll
// This is the physically correct Euler order for aircraft
```

### Forces Applied Each Frame (useFrame — runs at 60fps)
```javascript
// 1. LIFT — thrust vector pointing "up" relative to drone's current tilt
const liftForce = new THREE.Vector3(0, 1, 0)
  .applyEuler(droneRef.current.rotation)   // rotate by drone's orientation
  .multiplyScalar(controls.throttle * MAX_THROTTLE);

// 2. GRAVITY — always straight down
const gravityForce = new THREE.Vector3(0, GRAVITY, 0);

// 3. AERODYNAMIC DRAG — opposes velocity (simulates air resistance)
const aeroDamping = new THREE.Vector3(
  velocity.x * -0.2,   // lateral drag (low = drifty, more fun)
  velocity.y * -0.7,   // vertical drag (higher = less bouncy)
  velocity.z * -0.2
);

// 4. WIND — sine-wave based environmental disturbance
const windForceX = Math.sin(t * 0.5) * 0.5 + Math.sin(t * 1.3) * 0.2;
const windForceZ = Math.cos(t * 0.6) * 0.5 + Math.cos(t * 1.1) * 0.2;

// 5. TOTAL ACCELERATION
acceleration = lift + gravity + drag + wind;

// 6. INTEGRATE (Euler integration)
velocity += acceleration × delta;
position += velocity × delta;
```

### Atmospheric Turbulence (when airborne)
```javascript
// Micro-tremors applied to pitch/roll to simulate fighting the air
turbPitch = Math.sin(time * 5.2) * 0.005;
turbRoll  = Math.cos(time * 4.8) * 0.005;
```

### Stabilization Mode (auto-leveling)
When enabled, automatically returns pitch and roll to zero when you're not pushing a control input:
```javascript
if (isStabilized && !keys.ArrowUp && !keys.ArrowDown) targetPitch = 0;
if (isStabilized && !keys.a && !keys.d)               targetRoll  = 0;
```
This simulates a flight controller with attitude hold (like Betaflight's Angle mode).

### Hover Throttle Calculation
The throttle value needed to exactly counteract gravity:
```
hover_throttle = |GRAVITY| / MAX_THROTTLE = 9.81 / 20 ≈ 0.49
```
The simulator uses `0.5` as the gesture hover throttle, which is nearly exact.

---

## 10. Flight State Machine

State is tracked in a `useRef` (not React state, to avoid re-renders):

```
                  ┌──────────┐
      throttle=0  │ GROUNDED │  only state at y=0 with no throttle
      y=0         └────┬─────┘
                       │ throttle > 0
                       ▼
                  ┌──────────┐
         vel.y    │ASCENDING │  velocity.y > +0.5
         > +0.5   └────┬─────┘
                       │ velocity slows
                       ▼
                  ┌──────────┐
                  │ HOVERING │  |vel.y| < 0.5 AND |vel.xz| < 1
                  └────┬─────┘
                       │ pitch/roll applied
                       ▼
                  ┌──────────┐
                  │ DRIFTING │  |vel.x| or |vel.z| > 1
                  └────┬─────┘
                       │ throttle reduced
                       ▼
                  ┌───────────┐
        vel.y     │DESCENDING │  velocity.y < -0.5
        < -0.5    └───────────┘
```

States are displayed live on the HUD.

---

## 11. RTL (Return-to-Launch) Autopilot

Triggered by the **ABORT (RTL)** button on the HUD. A 4-phase autonomous sequence:

```
IDLE → ASCEND → CRUISE → DESCEND → LAND → IDLE
```

| Phase | What happens |
|-------|-------------|
| **ASCEND** | Climbs to SAFE_ALTITUDE (40m). Damps horizontal velocity. |
| **CRUISE** | Computes bearing to origin [0,0,0]. Yaws toward it. Pitches forward at 80% max pitch. Decelerates within 10m. |
| **DESCEND** | Reduces throttle (0.45 → 0.35). Damps X/Z velocity heavily. |
| **LAND** | Throttle = 0. RTL deactivates. State resets to IDLE. |

### Shortest-arc Yaw Logic (prevents spinning the long way around)
```javascript
let diff = bearingToBase - currentYaw;
while (diff < -Math.PI) diff += Math.PI * 2;  // wrap to [-π, +π]
while (diff >  Math.PI) diff -= Math.PI * 2;
targetYaw += diff;  // always takes the short path
```

### Manual Override
Any keyboard input (or active gesture) immediately cancels RTL:
```javascript
const manualInputDetected = keys.w || keys.s || ... || (gestureConnected && gestureCmd?.trigger === 1);
if (isRtlActive && manualInputDetected) setIsRtlActive(false);
```

---

## 12. Collision Detection

### Algorithm: AABB (Axis-Aligned Bounding Box)

Checks predicted **future position** against every building before committing the move:

```javascript
const futureX = position.x + velocity.x * delta;
const futureY = position.y + velocity.y * delta;
const futureZ = position.z + velocity.z * delta;

for each building b:
  insideX = |futureX - b.x| < (b.width/2 + droneRadius)
  insideZ = |futureZ - b.z| < (b.depth/2 + droneRadius)
  insideY = futureY < b.height
  
  if insideX AND insideZ AND insideY → COLLISION
```

**Drone radius:** 1.0 metre (inflated for stability).

### On Collision
```javascript
velocity.x *= -0.3;  // reverse + attenuate horizontal
velocity.z *= -0.3;
velocity.y *=  0.5;  // lose lift (half vertical momentum)
// RTL is cancelled, flightState set to GROUNDED briefly
```

### City Generation
150 buildings procedurally generated at startup with **strict exclusion zone**:
```javascript
if (Math.abs(x) < 30 && Math.abs(z) < 30) continue; // keep helipad clear
```
Buildings: width/depth 10–20m, height 15–55m, randomly placed within ±150m.

---

## 13. HUD & Telemetry Display

**File:** `src/simulator/HUD.jsx`

Updates at **20 Hz** (every 50ms via `setInterval`), reading from `useRef` objects (not React state) — no re-render overhead from the physics loop.

### Telemetry Fields
| Field | Source | Unit |
|-------|--------|------|
| ALT | `droneRef.position.y` | metres |
| VEL | `velocity.length()` | m/s |
| THR | `controls.throttle × 100` | % |
| PITCH | `controls.pitch × (180/π)` | degrees |
| ROLL | `controls.roll × (180/π)` | degrees |
| WIND X/Z | `windVector.x / windVector.z` | m/s |
| STATUS | `flightState.current` | string |
| PHASE | `rtlPhase.current` | string |

### Radar Map
- Circular mini-map showing distance and bearing to home [0,0,0]
- Arrow rotates to point toward home base
- **Red alert** when distance > 140 metres

### Gesture Mode Badge
```jsx
{gestureConnected && (
  <div>✋ GESTURE ACTIVE — X:+0.5 Y:-0.4</div>
)}
```
Appears automatically when `gesture_simulation.py` is running.

### Control Info Bar (context-aware)
- **Keyboard mode:** shows WASD / Arrow key controls
- **Gesture mode:** shows "FIST: Cut Throttle | HAND OPEN: Hover at 0.5m"

---

## 14. Mode Separation

### Design Principle
**Never run both modes simultaneously.** One script at a time, one drone target at a time.

| Script | Transport | Target |
|--------|-----------|--------|
| `gesture_drone.py` (original, unchanged) | UDP via cflib/CRTP | Physical LiteWing drone |
| `gesture_simulation.py` | WebSocket → Browser | OrbitX 3D simulator |

### Why Separate Scripts?
- Avoids accidental dual-control
- The original drone script has no WebSocket code — completely safe, nothing changed
- Clear operational intent: pick your target before running

### Keyboard Fallback in Simulator
When `gesture_simulation.py` is **not running**, the browser simulator falls back silently to keyboard control. This is handled in `useDronePhysics.js`:

```javascript
if (gestureConnected && gestureCmd) {
  // USE GESTURE — pitch/roll from MPU6050, throttle from LDR
} else {
  // USE KEYBOARD — W/S throttle, arrows pitch, A/D roll, Q/E yaw
}
```

---

## 15. Gesture → Control Mapping

### Full Mapping Table

| Physical Action | Sensor | Raw Value | Python Maps To | Simulator Does |
|----------------|--------|-----------|----------------|----------------|
| Fist closed (LDR dark) | LDR | < 2000 ADC | `trigger = "0"` | Throttle → 0, DISARMED |
| Hand open (LDR lit) | LDR | ≥ 2000 ADC | `trigger = "1"` | Throttle → 0.5 (hover) |
| Tilt hand **forward** | MPU6050 Y+ | filteredY > 0 | `vy = -gyroY/10` (negative) | `targetPitch += vy × MAX_PITCH` |
| Tilt hand **backward** | MPU6050 Y- | filteredY < 0 | `vy = -gyroY/10` (positive) | `targetPitch -= |vy| × MAX_PITCH` |
| Tilt hand **left** | MPU6050 X- | filteredX < 0 | `vx = gyroX/10` (negative) | `targetRoll += |vx| × MAX_ROLL` |
| Tilt hand **right** | MPU6050 X+ | filteredX > 0 | `vx = gyroX/10` (positive) | `targetRoll -= vx × MAX_ROLL` |
| Hand flat (neutral) | MPU6050 | X≈0, Y≈0 | `vx≈0, vy≈0` | No pitch/roll → HOVERING |

> Note: Yaw is **not controlled by gesture** — only by keyboard Q/E. The tutorial explicitly chose pitch and roll only, with height maintained by height-hold.

---

## 16. Data Flow — End to End

```
1. HAND MOVES
   │
   ▼
2. MPU6050 measures acceleration + gyro rates
   │
   ▼
3. Kalman filter (ESP32 firmware) fuses both → filteredX, filteredY
   │
   ▼
4. LDR reads ambient light → outputValue (0 or 1)
   │
   ▼
5. ESP32 sends via Bluetooth:  "-2.34,0.87,1\n"
   │ (BT Serial ~100Hz)
   ▼
6. gesture_simulation.py reads line from /dev/tty.ESP32_BT
   │
   ▼
7. Python parses: gyroX=-2.34, gyroY=0.87, trigger=1
   vx = round(-2.34 / 10.0) = -0.2  (roll)
   vy = -round(0.87 / 10.0) = -0.1  (pitch, inverted)
   │
   ▼
8. _broadcast({ pitch:-0.1, roll:-0.2, throttle:1, trigger:1 })
   │ (WebSocket JSON frame)
   ▼
9. useGestureSocket.js receives message → setGestureCmd(cmd)
   │
   ▼
10. useDronePhysics.js useFrame() (60fps):
    gestureConnected = true → gesture mode active
    armed = cmd.trigger === 1 → true
    targetPitch += cmd.pitch × MAX_PITCH  = -0.1 × 60° = -6°
    targetRoll  += cmd.roll  × MAX_ROLL   = -0.2 × 60° = -12°
    throttle lerp → 0.5
    │
    ▼
11. Physics equations:
    liftForce = (0,1,0).applyEuler(rotation) × throttle × 20N
    velocity  += (lift + gravity + drag + wind) × delta
    position  += velocity × delta
    │
    ▼
12. Three.js renders updated drone position at 60fps
    │
    ▼
13. HUD reads telemetry refs every 50ms → displays ALT, VEL, PITCH, ROLL
    GESTURE ACTIVE badge shows with "X:-0.2  Y:-0.1"
```

---

## 17. Common Q&A

**Q: Why use MPU6050 instead of a camera (MediaPipe)?**
> MPU6050 + Kalman gives reliable, low-latency (< 5ms) readings regardless of lighting. Camera-based gesture recognition requires good lighting, has higher CPU cost, and 100–200ms latency — too slow for drone control.

**Q: What is the Kalman filter doing exactly?**
> It estimates the true angle from two imperfect sources: the accelerometer (noisy but stable) and gyroscope (smooth but drifts). It computes a weighted average using statistical error covariance matrices, updating every loop iteration. Result: smooth, drift-free angle estimates.

**Q: Why is pitch inverted in Python (`vy = -gyroY/10`)?**
> The MPU6050's Y-axis points in the opposite direction to the drone's forward-flight axis. Without inversion, tilting forward would make the drone fly backward. Inverting makes the control feel natural.

**Q: How does the simulator know when the gesture script is running?**
> `useGestureSocket.js` attempts a WebSocket connection to `ws://localhost:8765` on mount, and auto-retries every 3 seconds. When the Python script starts, the server becomes available and the browser connects automatically. No manual action needed.

**Q: What happens if the Python script crashes mid-flight?**
> The WebSocket closes, `useGestureSocket` sets `connected = false` and `gestureCmd = null`. `useDronePhysics` falls through to the keyboard fallback branch. The drone continues responding to keyboard — no hard crash.

**Q: How does RTL know which direction to fly home?**
> It computes the bearing vector from current position to origin [0,0,0] using `Math.atan2`. It then yaws the drone to face that direction and applies MAX_PITCH × 0.8 to fly forward toward home. A shortest-arc yaw algorithm ensures the drone rotates the short way, not the long way.

**Q: Why is drag lower on X/Z (0.2) than Y (0.7)?**
> Lower lateral drag makes the drone feel "drifty" — it builds up horizontal momentum quickly, making flight feel fast and dynamic. Higher vertical drag prevents excessive bouncing on throttle changes.

**Q: What causes the wild spike values like `roll=+181.9`?**
> These are Kalman filter transients during rapid acceleration (e.g., wrist snap). The Kalman filter temporarily trusts the noisy accelerometer. This resolves in 1–2 frames. To fix: increase `r_measure` in the Arduino firmware for more smoothing.

**Q: Can you control both the real drone and simulator at once?**
> No — by design. Run `gesture_drone.py` for the real LiteWing. Run `gesture_simulation.py` for the browser simulator. They're completely separate scripts sharing only the serial reading logic.

**Q: What is CRTP / cflib?**
> CRTP (Crazy Real-Time Protocol) is the communication protocol used by Bitcraze (Crazyflie/LiteWing) drones. `cflib` is the Python SDK that implements it. Commands like `send_hover_setpoint(vx, vy, 0, 0.5)` send velocity-based motion commands over UDP to the drone at `192.168.43.42`.

**Q: How are buildings generated?**
> 150 buildings are procedurally placed at startup using `Math.random()`. Each building has random position (±150m from origin), width (10–20m), depth (10–20m), and height (15–55m). A 30m exclusion zone around [0,0,0] keeps the helipad clear. All 150 buildings are rendered with a single `InstancedMesh` draw call for 60fps performance.

---

*This document covers the complete technical implementation of the OrbitX gesture-controlled drone simulation system.*
