import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';

export function SpaceEnvironment() {
  const starsRef = useRef();

  useFrame((state, delta) => {
    if (starsRef.current) {
      // Create a slow, ambient galactic rotation
      starsRef.current.rotation.y -= delta * 0.05;
      starsRef.current.rotation.x -= delta * 0.01;
    }
  });

  return (
    <group>
      {/* Dense milky-way style starfield */}
      <Stars 
        ref={starsRef}
        radius={100} 
        depth={50} 
        count={8000} 
        factor={4} 
        saturation={0.5} 
        fade 
        speed={1} 
      />
      
      {/* Subdued ambient space void lighting */}
      <ambientLight intensity={0.2} color="#4a4a8f" />
      
      {/* A distant nebula glow via fog */}
      <fog attach="fog" args={['#020108', 10, 80]} />
    </group>
  );
}
