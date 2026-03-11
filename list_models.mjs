import { GoogleGenAI } from "@google/genai";
import { config } from 'dotenv';
config();
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) console.error("No API key found in .env");
const ai = new GoogleGenAI({ apiKey });
async function run() {
  try {
    const models = await ai.models.list();
    for await (const model of models) {
      console.log(model.name);
    }
  } catch(e) { console.error(e); }
}
run();
