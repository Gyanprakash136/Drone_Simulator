import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });

console.log("Key length:", process.env.GEMINI_API_KEY?.length);
console.log("Key starts with:", process.env.GEMINI_API_KEY?.substring(0, 5));
console.log("Key ends with:", process.env.GEMINI_API_KEY?.slice(-5));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [{ role: 'user', parts: [{ text: "ping" }] }]
    });
    console.log("SUCCESS:", response.text);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
test();
