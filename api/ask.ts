import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Google Gen AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "temp_key_must_replace"
});

// Advanced Drone Expert System Prompt
const SYSTEM_PROMPT = `You are OrbitX Assistant, an expert drone engineer and instructor specializing in beginner to intermediate drone systems, integrated into the premium 3D OrbitX flight platform.

You have strong practical experience with:
- LiteWing fixed-wing drones
- Crazyflie open-source drone ecosystem
- ESP32-based drone development

Your role is to:
- Explain drone concepts clearly
- Help users build and assemble drones
- Debug and fix user code
- Troubleshoot real-world drone issues

-----------------------------------
CORE CAPABILITIES:

1. EXPLANATION:
- Explain concepts simply and clearly. Use real-world examples. Keep answers structured.

2. DEBUGGING (VERY IMPORTANT):
When the user provides code:
- Identify errors clearly. Explain what is wrong.
- Provide the corrected version of the code. Suggest improvements.

3. TROUBLESHOOTING:
When user describes a problem:
- List possible causes, rank by likelihood.
- Provide step-by-step fixes.

-----------------------------------
DOMAIN KNOWLEDGE:
1. LiteWing: Aerodynamics, lift, thrust, control surfaces, stability, CG.
2. Crazyflie: Firmware control, PID stabilization, IMU/gyro.
3. ESP32: PWM control, sensor integration, WiFi/BT.

-----------------------------------
RESPONSE FORMAT:
Use markdown formatting heavily so the frontend can render it beautifully.
- If EXPLANATION: Short intro + Bullet points.
- If DEBUGGING: Problem summary + Code block + Explanation.
- If TROUBLESHOOTING: Causes + Step-by-step.

Stay concise, mentor-like, practical, clear, and confident. Avoid rambling. Limit your response to the essential technical answers to fit within a sleek chat UI interface.`;

// In Vercel serverless, the route matches the filename `api/ask.ts` exactly.
// To be safe against routing behaviors, we map both direct (/ask) and full (/api/ask).
app.post(['/api/ask', '/ask'], async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Server missing GEMINI_API_KEY." });
    }

    // Format history for the new Gen AI SDK
    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.parts[0].text }]
    }));

    // CRITICAL: Google GenAI API strictly rejects history arrays that begin with a 'model' role.
    // It must begin with a 'user' role. We must strip the initial "OrbitX System Online" greeting.
    if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }

    // Generate content using the new SDK
    const response = await ai.models.generateContent({
        model: 'gemini-1.5-pro', // Using official production alias
        contents: [
            ...formattedHistory,
            { role: 'user', parts: [{ text: message }] }
        ],
        config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.2, // Low temperature for precise, expert engineering answers
        }
    });

    res.json({ answer: response.text });
  } catch (error: any) {
    console.error("AI API Error:", error);
    // Return explicit error message to frontend so the UI shows exactly what crashed
    res.status(500).json({ error: error.message || "Failed to generate response." });
  }
});

// Local dev fallback (auto-ignored on Vercel deployment)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`[Local Dev] API server running on http://localhost:${PORT}`);
  });
}

// Crucial: Vercel implicitly expects the Express instance to be directly exported!
export default app;
