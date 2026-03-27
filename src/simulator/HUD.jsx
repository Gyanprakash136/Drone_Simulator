import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export function HUD({ droneRef, controls, velocity, windVector, flightState, rtlPhase, isStabilized, setIsStabilized, isRtlActive, setIsRtlActive }) {
  const [telemetry, setTelemetry] = useState({ 
    alt: 0, thr: 0, pitch: 0, roll: 0, vel: 0, 
    windX: 0, windZ: 0, state: 'GROUNDED', phase: 'IDLE',
    dist: 0, bearing: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      if (droneRef.current && controls.current && velocity.current) {
        const x = droneRef.current.position.x;
        const z = droneRef.current.position.z;
        const distance = Math.sqrt(x*x + z*z);
        const angle = Math.atan2(-x, -z); // Direct vector back to 0,0

        setTelemetry({
          alt: Math.max(0, droneRef.current.position.y).toFixed(2),
          thr: Math.max(0, controls.current.throttle * 100).toFixed(0),
          pitch: (controls.current.pitch * (180 / Math.PI)).toFixed(1),
          roll: (controls.current.roll * (180 / Math.PI)).toFixed(1),
          vel: velocity.current.length().toFixed(1),
          windX: windVector?.current?.x.toFixed(1) || '0.0',
          windZ: windVector?.current?.z.toFixed(1) || '0.0',
          state: flightState?.current || 'GROUNDED',
          phase: rtlPhase?.current || 'IDLE',
          dist: distance.toFixed(0),
          bearing: angle * (180 / Math.PI)
        });
      }
    }, 50);
    return () => clearInterval(interval);
  }, [droneRef, controls, velocity, windVector, flightState, rtlPhase]);

  const triggerRTL = () => {
     setIsRtlActive(true);
  };

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
      pointerEvents: 'none', display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', padding: '30px', zIndex: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        
        {/* Core HUD Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            style={{
              background: 'rgba(2, 1, 8, 0.6)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 255, 204, 0.3)', padding: '20px',
              borderRadius: '12px', color: '#00ffcc', fontFamily: 'monospace', fontSize: '1.2rem',
              boxShadow: '0 10px 30px rgba(0, 255, 204, 0.1)'
            }}
          >
            <div style={{ marginBottom: '10px', fontSize: '1.5rem', fontWeight: 'bold' }}>FLIGHT TELEMETRY</div>
            
            <div style={{ padding: '8px', background: isRtlActive ? 'rgba(255,255,0,0.2)' : 'rgba(0,0,0,0.5)', borderRadius: '6px', marginBottom: '10px' }}>
              <strong>MODE:</strong> <span style={{ color: isRtlActive ? '#ffcc00' : '#00ffcc' }}>{isRtlActive ? 'AUTO (RTL)' : 'MANUAL'}</span>
              {isRtlActive && <div style={{ fontSize: '0.9rem', color: '#fff', marginTop: '5px' }}>↳ PHASE: {telemetry.phase}</div>}
            </div>

            <div>STATUS: <span style={{ color: telemetry.state === 'GROUNDED' ? '#ff4444' : '#fff'}}>{telemetry.state}</span></div>
            <div style={{ marginTop: '10px' }}>ALT: {telemetry.alt} m</div>
            <div>VEL: {telemetry.vel} m/s</div>
            <div>THR: {telemetry.thr} %</div>
            <div style={{color: '#e0aaff'}}>PITCH: {telemetry.pitch}°</div>
            <div style={{color: '#e0aaff'}}>ROLL: {telemetry.roll}°</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            style={{
              background: 'rgba(200, 200, 255, 0.05)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)', padding: '15px',
              borderRadius: '12px', color: '#aab6c4', fontFamily: 'monospace', fontSize: '1rem'
            }}
          >
            <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>ATMOSPHERICS</div>
            <div>WIND X: <span style={{color: telemetry.windX < 0 ? '#ff8888' : '#88ff88'}}>{telemetry.windX}</span></div>
            <div>WIND Z: <span style={{color: telemetry.windZ < 0 ? '#ff8888' : '#88ff88'}}>{telemetry.windZ}</span></div>
          </motion.div>

        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', pointerEvents: 'auto' }}>
          <button onClick={() => setIsStabilized(!isStabilized)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: isStabilized ? '#00ffcc' : 'rgba(255, 255, 255, 0.1)', color: isStabilized ? '#020108' : '#fff', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
            {isStabilized ? 'STABILIZATION ON' : 'STABILIZATION OFF'}
          </button>
          
          <button onClick={triggerRTL} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ffcc00', background: isRtlActive ? '#ffcc00' : 'rgba(255, 204, 0, 0.1)', color: isRtlActive ? '#000' : '#ffcc00', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
            {isRtlActive ? 'RTL ACTIVE' : 'ABORT (RTL)'}
          </button>

          <button onClick={() => navigate('/')} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ff4444', background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', fontWeight: 'bold', cursor: 'pointer' }}>
            QUIT SIMULATOR
          </button>
        </div>

      </div>

      {/* Control Instructions */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '50px' }}>
        <div style={{ alignSelf: 'center', background: 'rgba(2, 1, 8, 0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '15px 30px', borderRadius: '12px', color: '#8d95a0', fontFamily: 'sans-serif', textAlign: 'center' }}>
          <strong style={{color:'#fff'}}>W / S</strong> : Throttle Up / Down &nbsp;&nbsp;|&nbsp;&nbsp;
          <strong style={{color:'#fff'}}>UP / DOWN</strong> : Pitch Forward / Back <br/>
          <strong style={{color:'#fff'}}>A / D</strong> : Roll Left / Right &nbsp;&nbsp;|&nbsp;&nbsp;
          <strong style={{color:'#fff'}}>Q / E</strong> : Spin / Yaw Left / Right
          <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#ffcc00' }}>[ Any Key Press Automatically Overrides RTL Mode ]</div>
        </div>

        {/* Circular Navigation Radar Map */}
        <div style={{
           width: '180px', height: '180px', borderRadius: '50%',
           background: telemetry.dist > 140 ? 'rgba(255, 50, 50, 0.2)' : 'rgba(2, 1, 8, 0.7)',
           border: telemetry.dist > 140 ? '2px solid #ff4444' : '2px solid rgba(0, 255, 204, 0.5)',
           display: 'flex', justifyContent: 'center', alignItems: 'center',
           position: 'relative', backdropFilter: 'blur(5px)',
           boxShadow: telemetry.dist > 140 ? '0 0 20px rgba(255, 0, 0, 0.5)' : 'none',
           transition: 'all 0.3s ease'
        }}>
           {/* Center Drone Position Dot */}
           <div style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%', position: 'absolute' }} />
           
           {/* Direction Arrow towards base [0,0] */}
           <div style={{
             position: 'absolute', width: '2px', height: '80px', transformOrigin: 'bottom center',
             transform: `rotate(${telemetry.bearing}deg)`,
             bottom: '50%'
           }}>
             {/* The Arrow Head */}
             <div style={{
                position: 'absolute', top: 0, left: '-4px', width: 0, height: 0, 
                borderLeft: '5px solid transparent', borderRight: '5px solid transparent', 
                borderBottom: telemetry.dist > 140 ? '15px solid #ff4444' : '15px solid #00ffcc'
             }} />
           </div>

           {/* Distance UI Overlay */}
           <div style={{ position: 'absolute', bottom: '15px', color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' }}>
              DIST: {telemetry.dist} m
           </div>
           
           {/* Compass Cardinals */}
           <div style={{ position: 'absolute', top: '5px', color: '#aaa', fontSize: '0.8rem' }}>N</div>
           <div style={{ position: 'absolute', bottom: '5px', color: '#aaa', fontSize: '0.8rem' }}>S</div>
           <div style={{ position: 'absolute', right: '10px', color: '#aaa', fontSize: '0.8rem' }}>E</div>
           <div style={{ position: 'absolute', left: '10px', color: '#aaa', fontSize: '0.8rem' }}>W</div>
        </div>
      </div>
    </div>
  );
}
