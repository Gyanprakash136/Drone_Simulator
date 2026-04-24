import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboard } from './useKeyboard';
import { useGestureSocket } from './useGestureSocket';
import * as THREE from 'three';

const MAX_THROTTLE = 20;
const MAX_PITCH = Math.PI / 3; // Allows deeper forward pitch for speed
const MAX_ROLL = Math.PI / 3;  // Allows deeper roll for much faster sideways skating
const GRAVITY = -9.81;

export function useDronePhysics(isStabilized, isRtlActive, setIsRtlActive, buildings) {
  const droneRef = useRef();
  const keys = useKeyboard();

  // ── Gesture socket (simulation mode) ──────────────────────────────
  // When gesture_simulation.py is running → gestureCmd drives the drone
  // When it is NOT running → keyboard works exactly as before (fallback)
  const { gestureCmd, connected: gestureConnected, gestureLabel } = useGestureSocket();
  
  // Physical State (Refs for performance)
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const controls = useRef({ throttle: 0, pitch: 0, roll: 0, yaw: 0 });
  const windVector = useRef({ x: 0, z: 0 });
  const flightState = useRef("GROUNDED");
  const rtlPhase = useRef("IDLE"); // ASCEND, CRUISE, DESCEND, LAND

  useFrame((state, delta) => {
    if (!droneRef.current) return;
    
    // Crucial for true Drone vectoring (Spin first, then tilt, then bank)
    if (droneRef.current.rotation.order !== 'YXZ') {
       droneRef.current.rotation.order = 'YXZ';
    }

    const time = state.clock.getElapsedTime();

    // 1. Environmental Anomalies (Sine-based Smooth Wind & Turbulence)
    // Dynamic wind changing strength over time - Tuned down for stability
    const windForceX = Math.sin(time * 0.5) * 0.5 + Math.sin(time * 1.3) * 0.2;
    const windForceZ = Math.cos(time * 0.6) * 0.5 + Math.cos(time * 1.1) * 0.2;
    windVector.current = { x: windForceX, z: windForceZ };
    
    // Micro-turbulence on Pitch & Roll to simulate fighting atmospheric pressure (only when airborne)
    let turbPitch = 0;
    let turbRoll = 0;
    if (droneRef.current.position.y > 0) {
      turbPitch = Math.sin(time * 5.2) * 0.005; // Drastically reduced for stability
      turbRoll = Math.cos(time * 4.8) * 0.005; 
    }

    // 2. Navigation & RTL State Machine
    let targetPitch = 0 + turbPitch;
    let targetRoll = 0 + turbRoll;
    let targetYaw = controls.current.yaw; // default maintain current yaw
    let targetThrottle = 0;

    // Manual Override Detection — keyboard OR active gesture counts as manual
    const manualInputDetected = keys.w || keys.s || keys.ArrowUp || keys.ArrowDown || keys.a || keys.d || keys.q || keys.e
      || (gestureConnected && gestureCmd?.trigger === 1);
    
    if (isRtlActive && manualInputDetected) {
      if (setIsRtlActive) setIsRtlActive(false);
      rtlPhase.current = "IDLE";
    }

    if (isRtlActive && rtlPhase.current === "IDLE") {
        rtlPhase.current = "ASCEND"; // Start sequence
    }

    if (isRtlActive && rtlPhase.current !== "IDLE") {
      const currentPos = droneRef.current.position;
      const basePos = new THREE.Vector3(0, 0, 0);
      const horizontalDist = Math.sqrt(currentPos.x * currentPos.x + currentPos.z * currentPos.z);
      
      const SAFE_ALTITUDE = 40;
      
      // Phase 1: ASCEND
      if (rtlPhase.current === "ASCEND") {
        targetThrottle = currentPos.y < SAFE_ALTITUDE ? 0.7 : Math.max(0, -GRAVITY / MAX_THROTTLE); // Hover throttle
        
        // Stabilize actively to avoid drifting while climbing
        targetPitch = 0;
        targetRoll = 0;
        velocity.current.x *= 0.9;
        velocity.current.z *= 0.9;

        if (currentPos.y >= SAFE_ALTITUDE - 2) {
           rtlPhase.current = horizontalDist > 5 ? "CRUISE" : "DESCEND";
        }
      }
      
      // Phase 2: CRUISE
      if (rtlPhase.current === "CRUISE") {
        targetThrottle = Math.max(0, -GRAVITY / MAX_THROTTLE) + 0.05; // counteract drag from pitching
        
        const direction = new THREE.Vector3().subVectors(basePos, currentPos).setY(0).normalize();
        
        // Physical Realistic Drone Navigation: Rotate nose to face base, and strictly pitch forward
        const bearingToBase = Math.atan2(direction.x, direction.z); // YAW angle to base
        
        // Shortest Angular Spin logic (Prevents unwinding 50 spins backward if you spun manually)
        let diff = bearingToBase - targetYaw;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        targetYaw += diff;
        
        targetPitch = MAX_PITCH * 0.8; // Fly straight ahead
        targetRoll = 0; // Do not crab-walk sideways
        
        // Decelerate near base
        if (horizontalDist < 10) {
           velocity.current.x *= 0.9;
           velocity.current.z *= 0.9;
           rtlPhase.current = "DESCEND";
        }
      }
      
      // Phase 3: DESCEND
      if (rtlPhase.current === "DESCEND") {
         targetThrottle = currentPos.y > 5 ? 0.45 : 0.35; // gentle drop
         targetPitch = 0;
         targetRoll = 0;
         velocity.current.x *= 0.8;
         velocity.current.z *= 0.8;

         if (currentPos.y <= 0.5) rtlPhase.current = "LAND";
      }

      // Phase 4: LAND
      if (rtlPhase.current === "LAND") {
         targetThrottle = 0;
         targetPitch = 0;
         targetRoll = 0;
         if (setIsRtlActive) setIsRtlActive(false);
         rtlPhase.current = "IDLE";
      }

      controls.current.throttle = THREE.MathUtils.lerp(controls.current.throttle, targetThrottle, delta * 2);

    } else {
      // ── GESTURE MODE: gesture_simulation.py is connected ──────────────────
      if (gestureConnected && gestureCmd) {
        const armed = gestureCmd.trigger === 1;

        // Fist (trigger=0) → cut throttle  |  Hand open (trigger=1) → hover
        if (armed) {
          controls.current.throttle = THREE.MathUtils.lerp(
            controls.current.throttle,
            0.5,        // hover throttle (matches send_hover_setpoint height=0.5)
            delta * 2
          );
          // Map ESP32 vx/vy directly to pitch & roll (same scaling as Python)
          targetPitch += (gestureCmd.pitch ?? 0) * MAX_PITCH;
          targetRoll  += (gestureCmd.roll  ?? 0) * MAX_ROLL;
        } else {
          // Fist detected — drop throttle, level out
          controls.current.throttle = THREE.MathUtils.lerp(
            controls.current.throttle, 0, delta * 2
          );
        }

      // ── KEYBOARD FALLBACK: gesture script not running ─────────────────────
      } else {
        if (keys.w) controls.current.throttle = THREE.MathUtils.lerp(controls.current.throttle, 1, delta * 2);
        else if (keys.s) controls.current.throttle = THREE.MathUtils.lerp(controls.current.throttle, -0.2, delta * 2);
        else controls.current.throttle = THREE.MathUtils.lerp(controls.current.throttle, 0, delta * 2);

        if (keys.ArrowUp)   targetPitch += MAX_PITCH;
        if (keys.ArrowDown) targetPitch -= MAX_PITCH;
        if (keys.a)         targetRoll  += MAX_ROLL;
        if (keys.d)         targetRoll  -= MAX_ROLL;
        if (keys.q)         targetYaw   += delta * 2.0;  // Spin left
        if (keys.e)         targetYaw   -= delta * 2.0;  // Spin right
      }
    }

    // Duplicate manual override code removed to fix lint errors

    // Apply auto-leveling stabilization vs manual raw stick input (Only operates when NOT manually steering)
    if (isStabilized && !isRtlActive) {
      if (!keys.ArrowUp && !keys.ArrowDown) targetPitch = 0 + (turbPitch * 0.2); 
      if (!keys.a && !keys.d) targetRoll = 0 + (turbRoll * 0.2);
    } 

    // Smoothly apply targeted pitch & roll
    controls.current.pitch = THREE.MathUtils.lerp(controls.current.pitch, targetPitch, delta * 4);
    controls.current.roll = THREE.MathUtils.lerp(controls.current.roll, targetRoll, delta * 4);
    controls.current.yaw = THREE.MathUtils.lerp(controls.current.yaw, targetYaw, delta * 6); // Fast responsive yaw

    // Apply rotations natively to mesh (YXZ ordered mapping)
    droneRef.current.rotation.x = controls.current.pitch;
    droneRef.current.rotation.y = controls.current.yaw;
    droneRef.current.rotation.z = -controls.current.roll;

    // 3. Physics Equations
    const liftForce = new THREE.Vector3(0, 1, 0)
        .applyEuler(droneRef.current.rotation)
        .multiplyScalar(controls.current.throttle * MAX_THROTTLE);

    const gravityForce = new THREE.Vector3(0, GRAVITY, 0);
    // Lower aerodynamic damping on X/Z allows much faster sideways drifting and forward momentum
    const aeroDamping = new THREE.Vector3(
      velocity.current.x * -0.2, 
      velocity.current.y * -0.7, 
      velocity.current.z * -0.2
    );
    
    // Apply smooth wind lateral force
    const externalWind = new THREE.Vector3(windForceX, 0, windForceZ);

    const acceleration = new THREE.Vector3()
      .add(liftForce)
      .add(gravityForce)
      .add(aeroDamping)
      .add(externalWind);

    // Velocity Constraints and Positioning
    if (droneRef.current.position.y <= 0 && controls.current.throttle <= 0) {
        velocity.current.set(0,0,0);
        droneRef.current.position.y = 0;
        flightState.current = "GROUNDED";
    } else {
        velocity.current.add(acceleration.multiplyScalar(delta));
        const plannedMovement = velocity.current.clone().multiplyScalar(delta);
        
        // --- HIGH PERFORMANCE BUILDING COLLISION LOGIC ---
        // Predict the absolute future position
        const futureX = droneRef.current.position.x + plannedMovement.x;
        const futureY = droneRef.current.position.y + plannedMovement.y;
        const futureZ = droneRef.current.position.z + plannedMovement.z;
        
        let collisionDetected = false;
        
        if (buildings) {
          // Drone has a roughly 1-meter radius
          const droneRadius = 1.0; 
          for (let i = 0; i < buildings.length; i++) {
             const b = buildings[i];
             // Simple AABB Intersection Math
             const insideX = Math.abs(futureX - b.x) < (b.width / 2 + droneRadius);
             const insideZ = Math.abs(futureZ - b.z) < (b.depth / 2 + droneRadius);
             const insideY = futureY < b.height;
             
             if (insideX && insideZ && insideY) {
                 collisionDetected = true;
                 break;
             }
          }
        }
        
        if (collisionDetected) {
            // Hard Crash! Reverse momentum heavily to simulate bounce and drop
            velocity.current.x *= -0.3;
            velocity.current.z *= -0.3;
            velocity.current.y *= 0.5; // lose lift
            
            // If in RTL mode, a crash knocks it offline
            if (isRtlActive && setIsRtlActive) setIsRtlActive(false);
            rtlPhase.current = "IDLE";
            flightState.current = "GROUNDED"; // Temporarily flash red state
        } else {
            // Path is clear, commit the geometry move
            droneRef.current.position.add(plannedMovement);

            // Predict State
            if (velocity.current.y > 0.5) flightState.current = "ASCENDING";
            else if (velocity.current.y < -0.5) flightState.current = "DESCENDING";
            else if (Math.abs(velocity.current.x) > 1 || Math.abs(velocity.current.z) > 1) flightState.current = "DRIFTING";
            else flightState.current = "HOVERING";
        }
    }

    // Ground Collision logic
    if (droneRef.current.position.y < 0) {
      droneRef.current.position.y = 0;
      velocity.current.y = Math.max(0, velocity.current.y * -0.2); // dampen bounce heavily
      velocity.current.x *= 0.7;
      velocity.current.z *= 0.7;
    }
    
    // Bounds
    const MAX_BOUND = 200;
    if(droneRef.current.position.x > MAX_BOUND) droneRef.current.position.x = MAX_BOUND;
    if(droneRef.current.position.x < -MAX_BOUND) droneRef.current.position.x = -MAX_BOUND;
    if(droneRef.current.position.z > MAX_BOUND) droneRef.current.position.z = MAX_BOUND;
    if(droneRef.current.position.z < -MAX_BOUND) droneRef.current.position.z = -MAX_BOUND;
    if(droneRef.current.position.y > 100) { droneRef.current.position.y = 100; velocity.current.y = 0; }

  });

  return { droneRef, velocity, controls, windVector, flightState, rtlPhase, gestureConnected, gestureLabel };
}
