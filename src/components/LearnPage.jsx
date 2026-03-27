import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function LearnPage({ onOpenChat }) {
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="learn-container">
      <nav className="learn-nav">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back to Hub</button>
        <span className="brand-badge">OrbitX Application Center</span>
      </nav>

      <div className="learn-content">
        
        {/* Section 1: Introduction */}
        <section className="learn-section intro">
          <h1>1. First Flight: LiteWing Systems</h1>
          <p>
            Welcome to the OrbitX Application Center. A <strong>LiteWing drone</strong> is a highly lightweight, fixed-wing glider. Unlike multirotors (like a quadcopter) that hover by constantly pushing massive amounts of air downwards, a fixed-wing drone flies exactly like a traditional airplane by coasting on the air.
          </p>
          <p>
            <strong>What you will build:</strong> A custom-built, ESP32-powered glider driven by a single rear motor.
            <br/>
            <strong>What you will learn:</strong> Component basic setup, exactly how to wire an electronic speed controller (ESC), and how to write basic C++ code to tell a motor when to spin.
          </p>
          <div className="key-takeaway">
            <strong>Key Takeaway:</strong> Fixed-wing drones are drastically more battery-efficient than quadcopters because their wings do the heavy lifting for "free", allowing you to fly much longer distances.
          </div>
          <button className="ask-ai-btn" onClick={onOpenChat}>Ask AI: What is the difference between Fixed-Wing and Quadcopters?</button>
        </section>

        {/* Section 2: Components Required */}
        <section className="learn-section">
          <h2>2. The Core Components</h2>
          <ul className="parts-list">
            <li><strong>Brushless Motor:</strong> The engine. It spins the propeller very fast to generate forward speed.</li>
            <li><strong>ESC (Electronic Speed Controller):</strong> The translator. It takes tiny, low-power signals from your computer chip and converts them into massive surges of power from the battery to spin the motor.</li>
            <li><strong>Propeller:</strong> Transforms the motor's spinning RPM into physical forward pushing force (thrust).</li>
            <li><strong>LiPo Battery (3S 11.1v):</strong> A high-power rechargeable battery.</li>
            <li><strong>ESP32 Microcontroller:</strong> The brains. This is a tiny, programmable computer chip (like an Arduino) that will generate your flight signals.</li>
            <li><strong>LiteWing Frame:</strong> The foam airplane body holding everything together.</li>
          </ul>
          <div className="key-takeaway">
            <strong>Key Takeaway:</strong> The ESP32 is too weak to power a motor directly. It only sends <em>information</em> to the ESC. The ESC handles the heavy battery power.
          </div>
          <button className="ask-ai-btn" onClick={onOpenChat}>Ask AI: Where can I buy cheap drone components?</button>
        </section>

        {/* Section 3: Understanding the System */}
        <section className="learn-section">
          <h2>3. How it Works (Physics Made Simple)</h2>
          <p>Think of flight as a balance between two forces: <strong>Thrust</strong> and <strong>Lift</strong>.</p>
          <div className="info-box">
            <p><strong>Thrust:</strong> Your motor spins the propeller, pulling or pushing the physical drone <em>forward</em> through the air.</p>
            <p><strong>Lift:</strong> As the drone moves forward, air rushes over the curved wings. This curved shape forces air to move faster over the top, creating a suction effect that physically pulls the drone <em>upward</em> into the sky.</p>
          </div>
          <div className="key-takeaway">
            <strong>Key Takeaway:</strong> The motor doesn't lift the drone. The motor just moves the drone forward. The <em>wings</em> lift the drone.
          </div>
          <button className="ask-ai-btn" onClick={onOpenChat}>Ask AI: Why do airplane wings have that specific curved shape?</button>
        </section>

        {/* Section 4: Step-by-Step Assembly */}
        <section className="learn-section">
          <h2>4. Assembly Guide</h2>

          <div className="step-block">
            <h3>Step 1: Balance the Frame (Center of Gravity)</h3>
            <p><strong>What to do:</strong> Find the exact physical balancing point of your foam plane (usually located 1/3rd of the way back from the front edge of the wing). You should be able to balance the whole plane perfectly flat on your two index fingers.</p>
            <p className="why-matters"><strong>Why this matters:</strong> If the plane is too heavy in the tail, it will immediately flip backward and crash on takeoff. If it is too heavy in the nose, it will nose-dive straight into the dirt. <em>Balance is everything.</em></p>
          </div>

          <div className="step-block">
            <h3>Step 2: Install the Motor</h3>
            <p><strong>What to do:</strong> Screw the brushless motor tightly to the plastic mounting bracket on the back of the fuselage.</p>
            <p className="why-matters"><strong>Why this matters:</strong> Motors spin at over 10,000 RPM and generate massive vibrations. A loose single screw will literally tear the motor off the plane in mid-air.</p>
          </div>

          <div className="step-block">
            <h3>Step 3: Secure the ESC</h3>
            <p><strong>What to do:</strong> Mount the ESC inside the plane. Make sure the hot metal heat-sink is exposed to moving air if possible.</p>
            <p className="why-matters"><strong>Why this matters:</strong> ESCs get incredibly hot handling battery power. If you bury it deep inside foam (which traps heat), the ESC will overheat, catch fire, or shut down its power mid-flight.</p>
          </div>

          <div className="key-takeaway">
            <strong>Key Takeaway:</strong> Always prioritize physical balance (Center of Gravity) over everything else when placing your heavy battery and components inside the frame.
          </div>
          <button className="ask-ai-btn" onClick={onOpenChat}>Ask AI: How do I calculate the exact Center of Gravity for a custom wing?</button>
        </section>

        {/* Section 5: Wiring Guide */}
        <section className="learn-section">
          <h2>5. The Wiring Diagram</h2>
          <div className="warning-box">
            ⚠️ <strong>DANGER:</strong> Do NOT plug the battery in while you are wiring! That is the very last step.
          </div>
          
          <p>Connecting the drone electronics is simple. You have three main zones: The Brain (ESP32), The Power Translator (ESC), and The Muscle (Motor).</p>
          
          <div className="wiring-diagram">
            <div className="wire-block esp">
              <h4>ESP32 (Brain)</h4>
              <div>PIN 18</div>
              <div>GND</div>
            </div>
            
            <div className="wire-lines">
              <div className="line signal">← Signal Wire (Yellow/White) →</div>
              <div className="line ground">← Ground Wire (Black/Brown) →</div>
              <div className="line red">← (Do NOT connect the red wire to ESP)</div>
            </div>

            <div className="wire-block esc">
              <h4>ESC (Power)</h4>
              <div>3 Thin Wires</div>
              <div>3 Thick Wires</div>
              <div>Battery Cable</div>
            </div>

            <div className="wire-lines">
              <div className="line dark">← Thick Wire A →</div>
              <div className="line dark">← Thick Wire B →</div>
              <div className="line dark">← Thick Wire C →</div>
            </div>

            <div className="wire-block motor">
              <h4>Motor (Muscle)</h4>
              <div>Phase A</div>
              <div>Phase B</div>
              <div>Phase C</div>
            </div>
          </div>

          <ul className="wiring-list">
            <li><strong>Step 1 (Muscle):</strong> Plug the 3 thick wires from the ESC directly into the 3 wires belonging to the Motor. Note: If the motor spins backward later, simply unplug any TWO of these wires and swap them!</li>
            <li><strong>Step 2 (Brain Signal):</strong> Find the tiny 3-wire plug coming from the ESC. Take the Signal wire (usually White or Yellow) and plug it into <strong>Pin 18</strong> on the ESP32.</li>
            <li><strong>Step 3 (Brain Ground):</strong> Take the Ground wire (usually Black or Brown) from that same tiny plug, and connect it to <strong>GND</strong> on the ESP32.</li>
          </ul>

          <div className="key-takeaway">
            <strong>Key Takeaway:</strong> Establishing a "Common Ground" (plugging the ESC's ground into the ESP32's ground) is an absolute mandatory law of electronics. If you skip this, your signal won't work and the motor will twitch violently.
          </div>
          <button className="ask-ai-btn" onClick={onOpenChat}>Ask AI: What happens if I accidentally plug the battery in backward?</button>
        </section>

        {/* Section 6: Code */}
        <section className="learn-section code-section">
          <h2>6. Programming the ESP32 Brain</h2>
          <p>Now we need to write code to specifically command the ESC. Drone speed controllers do not understand standard voltage; they expect a very specific pulsing signal called <strong>PWM</strong> (Pulse Width Modulation).</p>
          <p>We send a pulse that lasts exactly <code>1000</code> microseconds to tell the motor to STOP. We send a pulse of <code>2000</code> microseconds to go 100% MAXIMUM throttle.</p>
          
          <pre className="code-block">
            <code>
{`// Include the specific hardware library
#include <ESP32Servo.h>

Servo myESC;               // Create our ESC controller object
const int escPin = 18;     // Remember mapping Pin 18 ?

void setup() {
  Serial.begin(115200);
  
  // High-performance ESCs require strict 50Hz frequency constraints
  myESC.setPeriodHertz(50); 
  myESC.attach(escPin, 1000, 2000); // Set absolute minimum (1000) and maximum (2000)
  
  // SAFETY ARMING SEQUENCE
  // All drone ESCs refuse to work until they receive a confirmed 0% STOP signal.
  Serial.println("Sending 0% Throttle signal to safely ARM the system...");
  myESC.writeMicroseconds(1000); 
  
  // Wait 3 seconds for the ESC to register the signal and play its musical "beep"
  delay(3000); 
  
  Serial.println("SYSTEM ARMED: Stand back!");
}

void loop() {
  // Let's command the motor to spin at exactly 15% throttle for 2 seconds
  Serial.println("THROTTLE: 15%");
  myESC.writeMicroseconds(1150); 
  delay(2000); 
  
  // Cut engine back to 0% for 2 seconds
  Serial.println("THROTTLE: 0%");
  myESC.writeMicroseconds(1000); 
  delay(2000);
}`}
            </code>
          </pre>
          <p><strong>Explanation:</strong> Most crashes happen on the workbench. The <code>setup()</code> loop is entirely dedicated to "Arming" the ESC. A drone ESC is programmed to lock out all power unless it physically receives a 0% throttle command immediately upon booting up. This saves your fingers if you plug it in with a broken code script that accidentally demanded 100% throttle!</p>
          
          <div className="key-takeaway">
            <strong>Key Takeaway:</strong> <code>1000us</code> = Stop. <code>2000us</code> = Maximum Speed. Always send the Stop signal first during the setup sequence.
          </div>
          <button className="ask-ai-btn" onClick={onOpenChat}>Ask AI: Explain exactly what PWM means for a total beginner.</button>
        </section>

        {/* Section 7: Testing */}
        <section className="learn-section">
          <h2>7. Preparation Checklist</h2>
          <p>Before ever taking a drone outside, perform this strict indoor static test.</p>
          
          <ul className="checklist">
             <li><input type="checkbox" readOnly /> <strong>Remove Propeller:</strong> Physically pull the plastic propeller off the motor. DO NOT test code with blades attached!</li>
             <li><input type="checkbox" readOnly /> <strong>Upload Code:</strong> Plug a USB cable into your ESP32 and flash the code. Leave the USB plugged in so you can read the Serial Monitor.</li>
             <li><input type="checkbox" readOnly /> <strong>Battery Standby:</strong> Carefully plug the big LiPo battery perfectly into the ESC's red and black cables.</li>
             <li><input type="checkbox" readOnly /> <strong>Listen for Arming:</strong> The ESC should immediately play a musical jingle, followed by a solid Beep verifying the <code>1000us</code> arming signal.</li>
             <li><input type="checkbox" readOnly /> <strong>Observe Throttle:</strong> The brushless motor should gently spool up to 15% thrust for 2 seconds, and stop for 2 seconds, repeating infinitely.</li>
          </ul>

          <p className="why-matters"><strong>Why this matters:</strong> If you test this configuration with a propeller attached, the drone will violently launch off your desk ruining your equipment or injuring you.</p>

          <button className="ask-ai-btn" onClick={onOpenChat}>Ask AI: How do I safely secure a LiPo battery connector?</button>
        </section>

        {/* Section 8: Common Mistakes */}
        <section className="learn-section">
          <h2>8. Common Beginner Mistakes</h2>
          <p>If things go wrong, it is almost always one of these 3 errors:</p>
          
          <div className="trouble-grid">
            <div className="trouble-item">
              <strong>1. The endless beeping error.</strong>
              <p>The ESC just beeps "beep...beep...beep..." forever and the motor won't spin.</p>
              <p><em>The Fix:</em> This means your ESC is not receiving the <code>1000us</code> 0% arming signal. You either plugged the signal wire into the wrong pin (you used Pin 19 instead of 18), or you forgot to link the two Ground wires together!</p>
            </div>
            
            <div className="trouble-item">
              <strong>2. The stuttering motor.</strong>
              <p>The motor loudly twitches back and forth violently but won't spin freely.</p>
              <p><em>The Fix:</em> Unplug the battery immediately so it doesn't catch fire. You have a terrible soldering joint between your ESC and your Motor. One of the 3 phases is disconnected. Re-solder them.</p>
            </div>

            <div className="trouble-item">
              <strong>3. The airplane flips backward on takeoff.</strong>
              <p>The motor spins fine, you throw the plane, and it instantly loops backward and shatters the nose.</p>
              <p><em>The Fix:</em> Your Center of Gravity is severely tail-heavy. Push your massive LiPo battery much further to the front of the plane to balance the weight.</p>
            </div>
          </div>
          <div className="key-takeaway">
            <strong>Key Takeaway:</strong> 90% of all drone electronics failures are due to poor soldering or a missing Ground cable. Check your connections before touching code.
          </div>
          <button className="ask-ai-btn" onClick={onOpenChat}>Ask AI: Help! My motor is spinning exactly backward!</button>
        </section>

        {/* Section 9: Safety */}
        <section className="learn-section highlight-box">
          <h2>9. Flight Safety & Next Steps</h2>
          <p>Congratulations. You have successfully mapped a microcontroller to a high performance flight engine.</p>
          
          <ul>
            <li><strong>Battery Handling:</strong> LiPo batteries will instantly erupt in flames if punctured by an exacto-knife or if stored fully charged in a hot car. Store them safely in fireproof bags.</li>
            <li><strong>Spinning Knives:</strong> A drone propeller is a spinning plastic knife rotating at 15,000 RPM. Always power up your drone standing directly <em>behind</em> it, never leaning over it.</li>
          </ul>

          <h3>Next Steps</h3>
          <p>Right now, your drone simply accelerates indefinitely based on a pre-programmed loop. Your next step to achieving true flight is attaching a wireless Radio Controller Receiver (like an ExpressLRS module) to the ESP32 so you can manually throttle up and down in real time. We will cover this in Module 2!</p>
          
          <button className="ask-ai-btn" style={{marginTop: "20px"}} onClick={onOpenChat}>Ask AI: How do I hook up a Radio Controller to my ESP32?</button>
        </section>

        <div style={{ height: '100px' }} /> {/* scroll padding */}
      </div>
    </div>
  );
}
