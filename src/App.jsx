import React, { Suspense, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { motion } from 'framer-motion';

import { SpaceScene } from './components/SpaceScene';
import { ChatUI } from './components/ChatUI';
import { SimulatorScene } from './simulator/SimulatorScene';
import { LearnPage } from './components/LearnPage';

// Extracted former App logic closely representing the Landing Page View
function LandingPage({ onOpenChat }) {
  const navigate = useNavigate();
  return (
    <>
      <div className="canvas-container">
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 2, 12], fov: 45 }}>
          <Suspense fallback={null}>
            <SpaceScene onOpenChat={onOpenChat} onSimulate={() => navigate('/simulate')} onLearn={() => navigate('/learn')} />
          </Suspense>
        </Canvas>
      </div>
      
      <Loader />
      
      <div className="ui-overlay">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ pointerEvents: 'auto' }}
        >
          <h1 className="orbitx-title">OrbitX</h1>
          <p className="orbitx-desc">
            The next-generation framework for autonomous atmospheric and orbital flight operations.
          </p>
        </motion.div>
      </div>
    </>
  );
}

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage onOpenChat={() => setIsChatOpen(true)} />} />
        <Route path="/simulate" element={<SimulatorScene />} />
        <Route path="/learn" element={<LearnPage onOpenChat={() => setIsChatOpen(true)} />} />
      </Routes>
      <ChatUI isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}

export default App;
