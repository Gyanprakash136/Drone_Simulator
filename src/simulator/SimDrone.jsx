import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function SimDrone({ throttleRef }) {
  const propFL = useRef();
  const propFR = useRef();
  const propRL = useRef();
  const propRR = useRef();

  useFrame((state, delta) => {
    // Spin propellers based on throttle, with a base idle spin
    const spinSpeed = (throttleRef?.current?.throttle > 0 ? throttleRef.current.throttle * 50 : 2) + 5;
    if (propFL.current && propFR.current && propRL.current && propRR.current) {
      propFL.current.rotation.y += spinSpeed * delta;
      propFR.current.rotation.y -= spinSpeed * delta; // counter-rotating
      propRL.current.rotation.y -= spinSpeed * delta;
      propRR.current.rotation.y += spinSpeed * delta;
    }
  });

  return (
    <group>
      {/* Central Body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.6, 0.2, 0.6]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
      </mesh>
      
      {/* Arms forming an X */}
      <mesh position={[0.5, 0, 0.5]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.2]} />
        <meshStandardMaterial color="#333333" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[-0.5, 0, -0.5]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.2]} />
        <meshStandardMaterial color="#333333" roughness={0.5} metalness={0.5} />
      </mesh>

      <mesh position={[0.5, 0, -0.5]} rotation={[0, -Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.2]} />
        <meshStandardMaterial color="#333333" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[-0.5, 0, 0.5]} rotation={[0, -Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.2]} />
        <meshStandardMaterial color="#333333" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Motors and Props */}
      <Motor position={[0.85, 0.1, 0.85]} propRef={propFL} />
      <Motor position={[-0.85, 0.1, 0.85]} propRef={propFR} />
      <Motor position={[0.85, 0.1, -0.85]} propRef={propRL} />
      <Motor position={[-0.85, 0.1, -0.85]} propRef={propRR} />
      
      {/* Emissive Front LED Indicator */}
      <mesh position={[0, 0, 0.31]}>
        <boxGeometry args={[0.2, 0.05, 0.05]} />
        <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

function Motor({ position, propRef }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.1, 0.1, 0.15]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh ref={propRef} position={[0, 0.1, 0]}>
        <boxGeometry args={[0.6, 0.02, 0.05]} />
        <meshStandardMaterial color="#fff" opacity={0.6} transparent />
      </mesh>
    </group>
  );
}
