import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Drone } from './Drone';

// Falling Drone Instance (Y-axis movement)
function FallingDrone({ xOffset, zOffset, startY, speed, scale }) {
  const group = useRef();

  useFrame((state, delta) => {
    if (group.current) {
      group.current.position.y -= speed * delta;
      
      // Respawn at top
      if (group.current.position.y < -20) {
        group.current.position.y = 20;
        group.current.position.x = xOffset + (Math.random() * 4 - 2);
        group.current.position.z = zOffset + (Math.random() * 4 - 2);
      }
    }
  });

  return (
    <group ref={group} position={[xOffset, startY, zOffset]} scale={[scale, scale, scale]}>
      {/* Pitched down slightly */}
      <group rotation={[Math.PI / 8, 0, 0]}>
        <Drone position={[0,0,0]} scrollYProgress={{ get: () => 0 }} />
      </group>
    </group>
  );
}

// Flying Drone Instance (X-axis or Z-axis movement)
function FlyingDrone({ startX, startY, startZ, speedX, speedZ, scale, rotationY }) {
  const group = useRef();

  useFrame((state, delta) => {
    if (group.current) {
      group.current.position.x += speedX * delta;
      group.current.position.z += speedZ * delta;
      
      // Respawn logic for flying horizontally
      if (group.current.position.x > 30 || group.current.position.x < -30 || group.current.position.z > 20) {
        group.current.position.x = startX;
        group.current.position.z = startZ;
        group.current.position.y = startY + (Math.random() * 4 - 2);
      }
    }
  });

  return (
    <group ref={group} position={[startX, startY, startZ]} scale={[scale, scale, scale]}>
      {/* Rotated to face direction of travel */}
      <group rotation={[0, rotationY, 0]}>
        {/* Pitched forward slightly for aggressive flight stance */}
        <group rotation={[Math.PI / 12, 0, 0]}>
          <Drone position={[0,0,0]} scrollYProgress={{ get: () => 0 }} />
        </group>
      </group>
    </group>
  );
}

// Pool of Drones
export function FallingAircraft() {
  return (
    <group>
      {/* Distant falling drones */}
      <FallingDrone xOffset={-8} zOffset={-15} startY={5} speed={8} scale={0.3} />
      <FallingDrone xOffset={12} zOffset={-20} startY={12} speed={10} scale={0.2} />
      
      {/* Midground falling drones */}
      <FallingDrone xOffset={6} zOffset={-8} startY={8} speed={5} scale={0.5} />
      
      {/* === NEW: Flying Drones (Horizontal/Depth movement) === */}
      {/* Fly-by from deep left to right */}
      <FlyingDrone startX={-25} startY={2} startZ={-10} speedX={15} speedZ={5} scale={0.6} rotationY={Math.PI / 2} />
      
      {/* Fast fly-by from right to left in foreground */}
      <FlyingDrone startX={25} startY={-2} startZ={-5} speedX={-20} speedZ={2} scale={0.8} rotationY={-Math.PI / 2} />
    </group>
  );
}
