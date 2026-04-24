import React, { Suspense, useState, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, BakeShadows, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { SimDrone } from './SimDrone';
import { HUD } from './HUD';
import { useDronePhysics } from './useDronePhysics';
import { useFollowCam } from './useFollowCam';

function InteractiveScene({ isStabilized, isRtlActive, setIsRtlActive, setHUDData, buildings }) {
  const { droneRef, velocity, controls, windVector, flightState, rtlPhase, gestureConnected, gestureLabel } = useDronePhysics(isStabilized, isRtlActive, setIsRtlActive, buildings);
  useFollowCam(droneRef);

  // Expose refs up to HUD safely
  React.useEffect(() => {
    setHUDData({ droneRef, controls, velocity, windVector, flightState, rtlPhase, gestureConnected, gestureLabel });
  }, [droneRef, controls, velocity, windVector, flightState, rtlPhase, gestureConnected, gestureLabel, setHUDData]);

  return (
    <>
      {/* Realistic Daylight Environment */}
      <ambientLight intensity={0.5} color="#ffffff" />
      <directionalLight 
        position={[100, 200, 50]} 
        intensity={2.0} 
        castShadow 
        color="#fff4e0" 
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001} 
      />
      
      {/* Daylight Sky matches the directional light */}
      <Sky sunPosition={[100, 200, 50]} turbidity={0.6} rayleigh={1.2} elevation={45} />
      <Environment preset="city" />

      {/* Massive Concrete/Asphalt Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#2a2a2c" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Realistic Concrete Helipad */}
      <group position={[0, 0, 0]}>
        {/* Main Pad Platform */}
        <mesh receiveShadow position={[0, 0.01, 0]}>
          <cylinderGeometry args={[8, 8, 0.2, 32]} />
          <meshStandardMaterial color="#404040" roughness={0.9} />
        </mesh>
        
        {/* Yellow Safety Outer Ring */}
        <mesh position={[0, 0.12, 0]} receiveShadow rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[7.5, 7.8, 64]} />
          <meshBasicMaterial color="#ffcc00" />
        </mesh>

        {/* Center Helipad H */}
        <mesh position={[0, 0.12, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <planeGeometry args={[4, 4]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9}>
            <canvasTexture attach="map" image={createRealisticHTexture()} />
          </meshBasicMaterial>
        </mesh>
      </group>

      {/* Procedural Spaced-Out City with injected math matrices */}
      <CityBlocks buildings={buildings} />

      {/* The Drone - specifically spawned directly on the zero Y axis to instantly trigger GROUNDED state */}
      <group ref={droneRef} position={[0, 0, 0]}>
        <SimDrone throttleRef={controls} />
      </group>
      
      <BakeShadows />
    </>
  );
}

// Procedural City Generator using InstancedMesh for locked 60 FPS
function CityBlocks({ buildings }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  React.useLayoutEffect(() => {
    if (meshRef.current) {
      buildings.forEach((bld, idx) => {
        // Place building so its bottom rests exactly on the ground
        dummy.position.set(bld.x, bld.height / 2, bld.z);
        dummy.scale.set(bld.width, bld.height, bld.depth);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(idx, dummy.matrix);
        
        // Slightly random colored metallic concrete/glass
        const color = new THREE.Color();
        const shade = Math.random() * 0.4 + 0.3; // Grays and soft blues
        if (Math.random() > 0.8) {
             color.setRGB(shade, shade * 1.1, shade * 1.3); // Glassy blue tint
        } else {
             color.setRGB(shade, shade, shade); // standard concrete
        }
        meshRef.current.setColorAt(idx, color);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [buildings, dummy]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, buildings.length]} castShadow receiveShadow>
      {/* 1x1x1 generic cube, scaled dynamically by the dummy matrix */}
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.4} metalness={0.6} />
    </instancedMesh>
  );
}

// Procedural texture for Helipad H
function createRealisticHTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#ffffff'; // White paint
  ctx.fillRect(64, 48, 32, 160); // Left bar
  ctx.fillRect(160, 48, 32, 160); // Right bar
  ctx.fillRect(64, 112, 128, 32); // Cross bar
  return canvas;
}

export function SimulatorScene() {
  const [hudRefs, setHudRefs] = useState(null);
  const [isStabilized, setIsStabilized] = useState(true);
  const [isRtlActive, setIsRtlActive] = useState(false);

  // Generates physical real-world data for all 150 skyscrapers
  const buildingMap = useMemo(() => {
    const arr = [];
    let i = 0;
    while (i < 150) {
      const x = (Math.random() - 0.5) * 300;
      const z = (Math.random() - 0.5) * 300;
      
      // Strict Exclusion Zone
      if (Math.abs(x) < 30 && Math.abs(z) < 30) continue;

      arr.push({ 
         x, z, 
         width: Math.random() * 10 + 10, 
         depth: Math.random() * 10 + 10, 
         height: Math.random() * 40 + 15 
      });
      i++;
    }
    return arr;
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#87CEEB', overflow: 'hidden' }}>
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 5, 12], fov: 50 }}>
        <fog attach="fog" args={['#aab6c4', 50, 250]} />
        <Suspense fallback={null}>
          <InteractiveScene 
             isStabilized={isStabilized} 
             isRtlActive={isRtlActive}
             setIsRtlActive={setIsRtlActive}
             setHUDData={setHudRefs} 
             buildings={buildingMap}
          />
        </Suspense>
      </Canvas>

      {hudRefs && (
        <HUD 
          droneRef={hudRefs.droneRef} 
          controls={hudRefs.controls} 
          velocity={hudRefs.velocity} 
          windVector={hudRefs.windVector}
          flightState={hudRefs.flightState}
          rtlPhase={hudRefs.rtlPhase}
          isStabilized={isStabilized}
          setIsStabilized={setIsStabilized}
          isRtlActive={isRtlActive}
          setIsRtlActive={setIsRtlActive}
          gestureConnected={hudRefs.gestureConnected}
          gestureLabel={hudRefs.gestureLabel}
        />
      )}
    </div>
  );
}
