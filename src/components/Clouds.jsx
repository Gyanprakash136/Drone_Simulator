import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cloud, Clouds as DreiClouds } from '@react-three/drei';
import * as THREE from 'three';

export function Clouds() {
  const ref = useRef();
  
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.05; // Slow rotation of cloud mass
    }
  });

  return (
    <DreiClouds ref={ref} material={THREE.MeshBasicMaterial}>
      {/* Background clouds */}
      <Cloud 
        segments={20} 
        bounds={[15, 2, 2]} 
        volume={20} 
        color="#a2a2ff" 
        position={[0, -2, -15]} 
        opacity={0.3} 
        speed={0.1}
      />
      <Cloud 
        segments={20} 
        bounds={[10, 2, 2]} 
        volume={15} 
        color="#ffffff" 
        position={[8, 3, -10]} 
        opacity={0.2} 
        speed={0.2}
      />
      {/* Foreground subtle clouds for depth transition */}
      <Cloud 
        segments={10} 
        bounds={[8, 2, 2]} 
        volume={10} 
        color="#4a4a8f" 
        position={[-8, 0, -5]} 
        opacity={0.1} 
        speed={0.15}
      />
    </DreiClouds>
  );
}
