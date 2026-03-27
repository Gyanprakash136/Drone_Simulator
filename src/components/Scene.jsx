import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';

import { Drone } from './Drone';
import { Particles } from './Particles';
import { Clouds } from './Clouds';
import { FloatingCards } from './FloatingCards';

export function SceneContent() {
  const scroll = useScroll();
  const cameraGroup = useRef();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [visibleSection, setVisibleSection] = useState(0);

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
    // 1. Read strict scroll offset (0 to 1)
    const currentScroll = scroll.offset;
    
    // Determine active section (0,1,2,3) roughly based on scroll
    const sectionIndex = Math.floor(currentScroll * 4);
    if (sectionIndex !== visibleSection) {
      setVisibleSection(sectionIndex);
    }

    // 2. Animate camera position sequentially based on scroll (Cinematic Path!)
    // Start far and angled, dive in alongside the drone, then move ahead
    const startZ = 8;
    const startY = 1.5;
    const startX = 2; // slight angle starting
    
    // Lerp targets based on scroll segments
    let targetZ = startZ - (currentScroll * 15); // moves forward
    let targetY = startY - (currentScroll * 1);  // drops down slightly
    let targetX = startX - (currentScroll * 4);  // centers up

    // Apply mouse parallax on top of the calculated target
    const parallaxX = mousePosition.x * 0.5;
    const parallaxY = mousePosition.y * 0.5;
    
    const finalCamX = targetX + parallaxX;
    const finalCamY = targetY + parallaxY;
    const finalCamZ = targetZ;

    // Smooth camera damping using Three's lerp vectors
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, finalCamX, 3, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, finalCamY, 3, delta);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, finalCamZ, 3, delta);

    // Look at drone offset
    // As we scroll, look angle stays locked on drone until end where it might look slightly down
    const lookAtTarget = new THREE.Vector3(0, -currentScroll, 0);
    state.camera.lookAt(lookAtTarget);
  });

  return (
    <group ref={cameraGroup}>
      
      {/* Lighting and Environment */}
      <ambientLight intensity={0.5} color="#4a4a8f" />
      
      {/* Cinematic Rim Lights */}
      <spotLight position={[5, 10, 5]} angle={0.5} penumbra={1} intensity={2} color="#00ffcc" castShadow />
      <spotLight position={[-5, 5, -5]} angle={0.5} penumbra={1} intensity={2} color="#9d4edd" castShadow />
      
      {/* Premium Environment setup for physical reflections on the glossy drone body */}
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <Lightformer intensity={4} color="#e0aaff" position={[0, -10, 10]} scale={[10, 10, 1]} />
          <Lightformer intensity={4} color="#00ffff" position={[0, 10, 10]} scale={[10, 10, 1]} />
        </group>
      </Environment>

      {/* Main 3D content */}
      <Drone position={[0, 0, 0]} />
      
      {/* Layered Background Details */}
      <Clouds />
      <Particles count={600} />
      
      {/* 3D UI anchor overlays */}
      <FloatingCards visibleSection={visibleSection} />

    </group>
  );
}
