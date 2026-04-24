"""
gesture_simulation.py
─────────────────────
SIMULATION MODE — controls the browser-based 3D simulator only.
The original gesture script (drone mode) is completely unchanged.

How it works:
  1. Reads the same ESP32 Bluetooth serial port (COM4 on Windows)
  2. Parses the same "filteredX,filteredY,trigger" format
  3. Broadcasts the values over a WebSocket to the React simulator
  4. Does NOT connect to the physical LiteWing drone at all

Run this script INSTEAD of the original script when you want to
control the simulator. Run the original script when flying the real drone.

Requirements:
  pip install websockets pyserial
"""

import asyncio
import json
import threading
import time
import serial
import websockets

# ─── CONFIG ───────────────────────────────────────────────────────────────────
SERIAL_PORT = "/dev/tty.ESP32_BT"   # Mac Bluetooth port (ESP32 paired as ESP32_BT)
BAUD_RATE   = 9600
WS_PORT     = 8765            # Browser connects to ws://localhost:8765
# ──────────────────────────────────────────────────────────────────────────────

# ── WebSocket Server (runs in background thread) ──────────────────────────────
_clients = set()
_ws_loop = None


async def _ws_handler(websocket):
    """Accepts and tracks each browser connection."""
    _clients.add(websocket)
    print(f"[SIM] Browser connected  ({len(_clients)} total)")
    try:
        await websocket.wait_closed()
    finally:
        _clients.discard(websocket)
        print(f"[SIM] Browser disconnected ({len(_clients)} remaining)")


async def _run_ws_server():
    async with websockets.serve(_ws_handler, "localhost", WS_PORT):
        print(f"[SIM] WebSocket server ready  →  ws://localhost:{WS_PORT}")
        await asyncio.Future()  # run forever


def _start_ws_thread():
    """Launches the WebSocket server in a daemon background thread."""
    global _ws_loop
    _ws_loop = asyncio.new_event_loop()

    def _thread_fn():
        asyncio.set_event_loop(_ws_loop)
        _ws_loop.run_until_complete(_run_ws_server())

    t = threading.Thread(target=_thread_fn, daemon=True)
    t.start()


def _broadcast(command: dict):
    """
    Thread-safe: push a JSON command to every connected browser tab.
    Called from the main serial-reading loop.
    """
    if _ws_loop and _clients:
        msg = json.dumps(command)
        for client in list(_clients):
            asyncio.run_coroutine_threadsafe(client.send(msg), _ws_loop)


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    # 1. Start WebSocket server in background
    _start_ws_thread()
    time.sleep(0.5)  # give the server a moment to bind

    # 2. Open same Bluetooth serial port as original script
    try:
        ser = serial.Serial(SERIAL_PORT, baudrate=BAUD_RATE, timeout=1)
        print(f"[SIM] Connected to Bluetooth on {SERIAL_PORT}")
    except serial.SerialException as e:
        print(f"[SIM] ERROR: Could not open {SERIAL_PORT}: {e}")
        print("       Make sure the ESP32 is paired and the port is correct.")
        return

    time.sleep(1)
    ser.reset_input_buffer()
    print("[SIM] Waiting for hand gestures... Open browser simulator now.\n")

    # 3. Read-parse-broadcast loop (identical parsing to original script)
    while True:
        try:
            line = ser.readline().decode('utf-8').strip()
            if line:
                values = line.split(',')
                if len(values) < 3:
                    continue

                # ── Exact same cleaning logic as original script ──────────────
                clean_x = values[0].replace('0.0', '0.', 1) if '0.0' in values[0] else values[0]
                clean_y = values[1].replace('0.0', '0.', 1) if '0.0' in values[1] else values[1]
                trigger = values[2].strip()
                # ─────────────────────────────────────────────────────────────

                if trigger == "0":
                    print("[SIM] Fist detected → Throttle OFF")
                    _broadcast({
                        "pitch":    0,
                        "roll":     0,
                        "throttle": 0,
                        "trigger":  0,
                        "gesture":  "FIST — DISARMED"
                    })

                elif trigger == "1":
                    gyroX = float(clean_x)
                    gyroY = float(clean_y)

                    # ── Exact same mapping as original script ─────────────────
                    vx = round(gyroX / 10.0, 1)   # Roll   (left/right tilt)
                    vy = -round(gyroY / 10.0, 1)  # Pitch  (fwd/back tilt)
                    # ─────────────────────────────────────────────────────────

                    gesture_label = f"X:{vx:+.1f}  Y:{vy:+.1f}"
                    print(f"[SIM] Gesture → pitch={vy:+.1f}  roll={vx:+.1f}  {gesture_label}")

                    _broadcast({
                        "pitch":    vy,   # forward/back (vx in tutorial = horizontal)
                        "roll":     vx,   # left/right
                        "throttle": 1,
                        "trigger":  1,
                        "gesture":  gesture_label
                    })

        except KeyboardInterrupt:
            print("\n[SIM] Stopped by user.")
            break
        except Exception:
            # Skip any malformed serial lines — same as original script
            pass


if __name__ == "__main__":
    main()
