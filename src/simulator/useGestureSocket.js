import { useEffect, useRef, useState } from 'react';

/**
 * useGestureSocket
 * ─────────────────
 * Connects to the Python gesture_simulation.py WebSocket bridge.
 * Auto-reconnects every 3 seconds so keyboard fallback always works
 * when the gesture script is not running.
 *
 * Received JSON format:
 * {
 *   pitch:    number,   // -1.0 to +1.0  (forward/back tilt)
 *   roll:     number,   // -1.0 to +1.0  (left/right tilt)
 *   throttle: number,   // 0 = disarmed, 1 = hover
 *   trigger:  0 | 1,   // LDR: 0 = fist, 1 = hand open
 *   gesture?: string    // human-readable label for HUD
 * }
 */
export function useGestureSocket(url = 'ws://localhost:8765') {
  const [gestureCmd, setGestureCmd]   = useState(null);
  const [connected, setConnected]     = useState(false);
  // Store latest gesture label for HUD display
  const [gestureLabel, setGestureLabel] = useState('');

  const wsRef           = useRef(null);
  const reconnectTimer  = useRef(null);

  useEffect(() => {
    let alive = true; // prevent reconnect after unmount

    function connect() {
      if (!alive) return;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!alive) return;
        setConnected(true);
        console.log('[GestureSocket] Connected to gesture bridge');
      };

      ws.onclose = () => {
        if (!alive) return;
        setConnected(false);
        setGestureCmd(null);
        setGestureLabel('');
        console.log('[GestureSocket] Disconnected — retrying in 3s…');
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        // onclose fires right after onerror, so reconnect is handled there
        setConnected(false);
      };

      ws.onmessage = (event) => {
        try {
          const cmd = JSON.parse(event.data);
          setGestureCmd(cmd);
          if (cmd.gesture) setGestureLabel(cmd.gesture);
        } catch {
          /* ignore malformed packets */
        }
      };
    }

    connect();

    return () => {
      alive = false;
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [url]);

  return { gestureCmd, connected, gestureLabel };
}
