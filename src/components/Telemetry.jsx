import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll, Html } from '@react-three/drei';

export function Telemetry() {
  const scroll = useScroll();
  
  // Refs to update DOM directly for max performance (no React state in useFrame)
  const altRef = useRef(null);
  const spdRef = useRef(null);
  const modeRef = useRef(null);

  useFrame(() => {
    if (!scroll) return;
    
    const scrollProgress = scroll.offset;
    
    // Noise
    const noiseAlt = Math.random() * 0.5 - 0.25;
    const noiseSpd = Math.random() * 2 - 1;
    
    const newAlt = 1450 + (scrollProgress * 200) + noiseAlt;
    const newSpd = scrollProgress > 0.1 ? 45 + (scrollProgress * 100) + noiseSpd : 0;
    
    let newMode = 'STABILIZE';
    if (scrollProgress > 0.4) newMode = 'ACRO';
    if (scrollProgress > 0.8) newMode = 'AUTONOMOUS';

    // Update DOM directly
    if (altRef.current) altRef.current.innerText = newAlt.toFixed(2);
    if (spdRef.current) spdRef.current.innerText = newSpd.toFixed(1);
    if (modeRef.current) {
      modeRef.current.innerText = newMode;
      modeRef.current.style.color = newMode === 'AUTONOMOUS' ? '#9d4edd' : (newMode === 'ACRO' ? '#e0aaff' : '#ff00aa');
    }
  });

  return (
    <Html>
      <div className="telemetry-overlay" style={{
        position: 'fixed',
        top: '40px',
        left: '40px',
        pointerEvents: 'none',
        zIndex: 100,
        fontFamily: 'monospace',
        color: '#00ffcc',
        background: 'rgba(0, 20, 10, 0.4)',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid rgba(0, 255, 204, 0.2)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 0 20px rgba(0, 255, 204, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '240px'
      }}>
        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '4px' }}>FCH-LINK // SYS NOMINAL</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
          <span>ALT (m):</span>
          <span ref={altRef} style={{ fontWeight: 'bold' }}>1450.00</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
          <span>SPD (km/h):</span>
          <span ref={spdRef} style={{ fontWeight: 'bold' }}>0.0</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginTop: '8px' }}>
          <span>MODE:</span>
          <span ref={modeRef} style={{ fontWeight: 'bold', color: '#ff00aa', transition: 'color 0.3s' }}>STABILIZE</span>
        </div>
        
        {/* Decorative crosshair */}
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '-30px',
          width: '20px',
          height: '1px',
          background: '#00ffcc',
          opacity: 0.5
        }} />
      </div>
    </Html>
  );
}
