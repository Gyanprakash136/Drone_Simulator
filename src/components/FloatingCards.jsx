import React from 'react';
import { Html, Float } from '@react-three/drei';

export function FloatingCards({ visibleSection }) {
  // We only show the specific card based on scroll, or show them at different coordinates.
  // In a cinematic scene, they can exist at different Z depths or around the drone.
  
  return (
    <group position={[0,0,0]}>
      {/* Learn Card */}
      <Float position={[-3, 1, -2]} speed={2} floatIntensity={0.5}>
        <Html 
          transform 
          distanceFactor={10} 
          occlude 
          style={{
            opacity: visibleSection === 1 || visibleSection === 0 ? 1 : 0.2,
            transition: 'opacity 0.5s ease'
          }}
        >
          <div className="glass-card">
            <h3>01. Learn</h3>
            <p>Understand the aerodynamics and physics of modern drone flight. Master the basics before you build.</p>
          </div>
        </Html>
      </Float>

      {/* Build Card */}
      <Float position={[3.5, -1, -4]} speed={1.5} floatIntensity={0.3}>
        <Html 
          transform 
          distanceFactor={10} 
          occlude
           style={{
            opacity: visibleSection === 2 ? 1 : 0.2,
            transition: 'opacity 0.5s ease'
          }}
        >
          <div className="glass-card">
            <h3>02. Build</h3>
            <p>Assemble your rig with modular, high-performance parts engineered for precision and durability.</p>
          </div>
        </Html>
      </Float>

      {/* Code Card */}
      <Float position={[-2, -2, -6]} speed={2.5} floatIntensity={1}>
        <Html 
          transform 
          distanceFactor={10} 
          occlude
          style={{
            opacity: visibleSection === 3 ? 1 : 0.2,
            transition: 'opacity 0.5s ease'
          }}
        >
          <div className="glass-card" style={{ borderColor: 'rgba(157, 78, 221, 0.4)' }}>
            <h3>03. Code</h3>
            <p>Flash custom firmware and program autonomous flight paths using our intuitive scripting SDK.</p>
          </div>
        </Html>
      </Float>
    </group>
  );
}
