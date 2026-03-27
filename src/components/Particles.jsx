import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Layered particle system for deep parallax effect
export function Particles({ count = 500 }) {
  const points = useRef();

  // Generate random particle positions
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Spread particles over a large area to create depth
      positions[i * 3] = (Math.random() - 0.5) * 50; // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50; // z
    }
    return positions;
  }, [count]);

  useFrame((state, delta) => {
    if (points.current) {
      // Very slow rotation for ambient background movement
      points.current.rotation.y -= delta * 0.02;
      points.current.rotation.x -= delta * 0.01;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#a2a2ff"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
