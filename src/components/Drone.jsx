import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Float } from '@react-three/drei';

// A minimalist, modular fixed-wing drone
export function Drone({ position = [0, 0, 0], scrollYProgress }) {
  const droneRef = useRef();
  const propellerRef = useRef();

  // Premium glossy material for the drone body
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    metalness: 0.1,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  const accentMaterial = new THREE.MeshPhysicalMaterial({
    color: '#0f1016',
    metalness: 0.8,
    roughness: 0.2,
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: '#1a1a1a',
    metalness: 0.9,
    roughness: 0.1,
    transmission: 0.9,
    opacity: 0.8,
    transparent: true,
  });

  useFrame((state, delta) => {
    // Spin the propeller fast
    if (propellerRef.current) {
      propellerRef.current.rotation.x += delta * 20;
    }

    // Advanced hover physics: Slight forward drift & tilt
    if (droneRef.current) {
      const t = state.clock.getElapsedTime();
      
      // Calculate scroll-based tilt: As user scrolls, drone banks slightly
      // Assuming scrollYProgress is 0 to 1
      const scrollOffset = scrollYProgress ? scrollYProgress.get() : 0;
      
      // Base hover tilt + banking on scroll
      const baseTiltX = Math.sin(t * 0.5) * 0.05;
      const baseTiltZ = Math.cos(t * 0.3) * 0.05;
      
      // Smoothly interpolate rotation
      droneRef.current.rotation.x = THREE.MathUtils.lerp(droneRef.current.rotation.x, baseTiltX + scrollOffset * 0.5, 0.1);
      droneRef.current.rotation.z = THREE.MathUtils.lerp(droneRef.current.rotation.z, baseTiltZ + scrollOffset * -0.2, 0.1);
      
      // Slight forward drift / bobbing based on scroll
      droneRef.current.position.z = THREE.MathUtils.lerp(droneRef.current.position.z, Math.sin(t) * 0.5 + scrollOffset * -2, 0.05);
      
      // Add subtle yaw rotation over time
      droneRef.current.rotation.y = Math.sin(t * 0.2) * 0.1;
    }
  });

  return (
    <Float
      speed={2} // Animation speed
      rotationIntensity={0.2} // XYZ rotation intensity
      floatIntensity={0.5} // Up/down float intensity
      floatingRange={[-0.2, 0.2]} // Range of y-axis values the object will float within
    >
      <group position={position} ref={droneRef} castShadow receiveShadow>
        
        {/* Fuselage (Main Body) */}
        <mesh position={[0, 0, 0]} material={bodyMaterial}>
          <capsuleGeometry args={[0.3, 2, 4, 16]} />
          <mesh position={[0, 0.2, 0.5]} material={glassMaterial}>
            {/* Cockpit / Sensor glass */}
            <capsuleGeometry args={[0.25, 0.8, 4, 16]} />
          </mesh>
        </mesh>

        {/* Main Wings */}
        <mesh position={[0, 0, -0.2]} rotation={[0, 0, 0]} material={bodyMaterial}>
          <boxGeometry args={[4, 0.05, 0.8]} />
        </mesh>
        
        {/* Winglets (Tips) */}
        <mesh position={[1.95, 0.15, -0.2]} rotation={[0, 0, Math.PI / 12]} material={accentMaterial}>
          <boxGeometry args={[0.05, 0.4, 0.8]} />
        </mesh>
        <mesh position={[-1.95, 0.15, -0.2]} rotation={[0, 0, -Math.PI / 12]} material={accentMaterial}>
          <boxGeometry args={[0.05, 0.4, 0.8]} />
        </mesh>

        {/* Tail Boom */}
        <mesh position={[0, 0, -1.5]} rotation={[Math.PI / 2, 0, 0]} material={accentMaterial}>
          <cylinderGeometry args={[0.05, 0.1, 1, 16]} />
        </mesh>

        {/* V-Tail / Horizontal Stabilizer */}
        <group position={[0, 0, -2]}>
          <mesh rotation={[Math.PI / 6, 0, Math.PI / 4]} material={bodyMaterial}>
            <boxGeometry args={[1.2, 0.05, 0.3]} />
          </mesh>
          <mesh rotation={[-Math.PI / 6, 0, -Math.PI / 4]} material={bodyMaterial}>
            <boxGeometry args={[1.2, 0.05, 0.3]} />
          </mesh>
        </group>

        {/* Front Propeller Engine Block */}
        <mesh position={[0, 0, 1.3]} rotation={[Math.PI / 2, 0, 0]} material={accentMaterial}>
          <cylinderGeometry args={[0.2, 0.25, 0.2, 16]} />
        </mesh>

        {/* Propeller Blades */}
        <group position={[0, 0, 1.45]} ref={propellerRef}>
          <mesh material={accentMaterial}>
             <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
          </mesh>
          <mesh rotation={[0, 0, 0]} material={accentMaterial}>
            <boxGeometry args={[1.5, 0.02, 0.1]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} material={accentMaterial}>
            <boxGeometry args={[1.5, 0.02, 0.1]} />
          </mesh>
        </group>

      </group>
    </Float>
  );
}
