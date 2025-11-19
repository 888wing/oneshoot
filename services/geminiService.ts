
import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// Analyze code to generate metadata (Title, Description, Tags, Category)
export const generateGameMetadata = async (code: string) => {
  const ai = getAiClient();
  if (!ai) throw new Error("AI Client not initialized");

  const prompt = `
    Analyze the following HTML5 game code. 
    Provide a catchy Title, a short engaging Description (max 150 chars), 
    a Category (Action, RPG, Puzzle, Arcade, Simulation, Strategy, or Other),
    and 3-5 relevant Tags.
    Also, estimate a difficulty level from 1-10.
    
    Code snippet (truncated if too long):
    ${code.substring(0, 15000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            difficultyEstimate: { type: Type.NUMBER }
          },
          required: ["title", "description", "tags", "category"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Metadata Generation Error:", error);
    return {
      title: "Untitled Prototype",
      description: "A new game prototype.",
      category: "Other",
      tags: ["Indie", "Prototype"],
      difficultyEstimate: 5
    };
  }
};

// Analyze code to provide constructive feedback (Virtual Playtester)
export const getAiCodeReview = async (code: string) => {
  const ai = getAiClient();
  if (!ai) throw new Error("AI Client not initialized");

  const prompt = `
    Act as a senior game developer and playtester. 
    Analyze this raw HTML/JS game code. 
    Identify 2 potential performance or logic issues (bugs) and 2 gameplay improvement suggestions.
    Be constructive and encouraging.

    Code:
    ${code.substring(0, 20000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful code mentor for game developers."
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Review Error:", error);
    return "Could not generate AI review at this time.";
  }
};
