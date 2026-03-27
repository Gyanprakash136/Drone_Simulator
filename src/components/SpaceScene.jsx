import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';

import { SpaceEnvironment } from './SpaceEnvironment';
import { Planets } from './Planets';
import { FallingAircraft } from './FallingAircraft';
import { OrbitXCenter } from './OrbitXCenter';
export function SpaceScene({ onOpenChat, onSimulate, onLearn }) {
  const cameraGroup = useRef();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse for cinematic parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Normalize mouse to -1 to 1
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    // Apply cinematic mouse parallax to camera position
    // Base camera position in App is [0, 2, 12]
    // We want the camera to bob slightly around that center
    
    // Lerp targets based on mouse position
    const targetX = mousePosition.x * 1.5;
    const targetY = 2 + mousePosition.y * 1.5;
    const targetZ = 12;

    // Smooth camera damping using Three's lerp vectors
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, targetX, 2, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, targetY, 2, delta);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetZ, 2, delta);

    // Look at center slightly offset to account for mouse movement
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={cameraGroup}>
      {/* Immersive Dark Space Ambience */}
      <SpaceEnvironment />
      
      {/* Background celestial bodies */}
      <Planets />
      
      {/* Moving space traffic / falling drones */}
      <FallingAircraft />
      
      {/* Main Interactive Hub */}
      <OrbitXCenter onOpenChat={onOpenChat} onSimulate={onSimulate} onLearn={onLearn} />

      {/* Cinematic Rim Lights */}
      <spotLight position={[10, 20, 10]} angle={0.5} penumbra={1} intensity={3} color="#00ffcc" castShadow />
      <spotLight position={[-10, 10, -10]} angle={0.5} penumbra={1} intensity={3} color="#9d4edd" castShadow />
      <pointLight position={[0, -5, 5]} intensity={1} color="#e0aaff" />

      {/* Physical Reflections */}
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <Lightformer intensity={2} color="#9d4edd" position={[0, -10, 10]} scale={[10, 10, 1]} />
          <Lightformer intensity={4} color="#00ffcc" position={[0, 10, 10]} scale={[10, 10, 1]} />
        </group>
      </Environment>

    </group>
  );
}
