import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';

export function Planets() {
  const planet1Ref = useRef();
  const planet2Ref = useRef();

  useFrame((state, delta) => {
    // Very slow rotation
    if (planet1Ref.current) planet1Ref.current.rotation.y += delta * 0.05;
    if (planet2Ref.current) planet2Ref.current.rotation.y -= delta * 0.03;
  });

  return (
    <group>
      {/* Giant Gas Giant Planet in Background */}
      <mesh ref={planet1Ref} position={[-20, 10, -40]} scale={[12, 12, 12]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial 
          color="#1a0b2e"
          roughness={0.7}
          metalness={0.1}
          emissive="#240046"
          emissiveIntensity={0.5}
        />
        {/* Subtle Atmospheric Glow Frame (Fake atmosphere with an outer sphere) */}
        <mesh scale={[1.05, 1.05, 1.05]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color="#7b2cbf" transparent opacity={0.1} />
        </mesh>
      </mesh>

      {/* Cyber/Neon styled small planet */}
      <Float speed={1} floatIntensity={0.5} floatingRange={[-0.5, 0.5]}>
        <mesh ref={planet2Ref} position={[15, -5, -20]} scale={[4, 4, 4]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial 
            color="#001a14" 
            emissive="#00ffcc" 
            emissiveIntensity={0.2}
            roughness={0.2}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            wireframe={true} // Cyber aesthetic
          />
        </mesh>
      </Float>
    </group>
  );
}
