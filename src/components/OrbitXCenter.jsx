import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import { Drone } from './Drone';

export function OrbitXCenter({ onOpenChat, onSimulate, onLearn }) {
  const centerGroup = useRef();

  useFrame((state) => {
    // Gentle bobbing effect for the entire central hub
    if (centerGroup.current) {
      centerGroup.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <group ref={centerGroup} position={[2, 0, 0]}>
      {/* Central Hero Object - we can reuse a large Drone or another geometric shape */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Drone position={[0, 0, 0]} scrollYProgress={{ get: () => 0 }} />
      </Float>

      {/* 3D Interactive Buttons Orbiting the Center */}

      {/* LEARN */}
      <Html position={[-3, 1.5, 0]} center transform occlude distanceFactor={8}>
        <button 
          className="scene-button" 
          onClick={onLearn}
        >
          LEARN
        </button>
      </Html>

      {/* SIMULATE */}
      <Html position={[3, 1, 1]} center transform occlude distanceFactor={8}>
        <button 
          className="scene-button simulate"
          onClick={onSimulate}
        >
          SIMULATE
        </button>
      </Html>

      {/* ASK */}
      <Html position={[-2.5, -1.5, 0.5]} center transform occlude distanceFactor={8}>
        <button 
          className="scene-button ask"
          onClick={onOpenChat}
        >
          ASK
        </button>
      </Html>

    </group>
  );
}
