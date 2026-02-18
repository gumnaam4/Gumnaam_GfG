
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function interpretIntent(intent: string) {
  if (!intent.trim()) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Interpret this urban planning intent: "${intent}". Map it to normalized urban parameters.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            greenRatio: { type: Type.NUMBER, description: "Ratio of green space (0-1)" },
            commercialRatio: { type: Type.NUMBER, description: "Ratio of commercial space (0-1)" },
            residentialRatio: { type: Type.NUMBER, description: "Ratio of residential space (0-1)" },
            roadComplexity: { type: Type.NUMBER, description: "Complexity of road network (0-1)" },
            maxBuildingHeight: { type: Type.NUMBER, description: "Scaling factor for building heights (0.5-2.0)" },
            zoneClustering: { type: Type.NUMBER, description: "How tightly zones cluster (0-1)" }
          },
          required: ["greenRatio", "commercialRatio", "residentialRatio", "roadComplexity", "maxBuildingHeight", "zoneClustering"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Failed to interpret semantic intent:", error);
    return null;
  }
}
