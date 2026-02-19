
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedEvent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const extractEventFromImage = async (base64Image: string): Promise<ExtractedEvent | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image.split(',')[1] || base64Image,
              },
            },
            {
              text: "Please extract event information from this image. Use a 'fresh green apple' and 'clear summer' tone. For colors, use Tailwind classes like 'bg-lime-400', 'bg-green-400', 'bg-sky-300', 'bg-yellow-300', 'bg-purple-300'. Return a JSON object with: name, date (YYYY-MM-DD), time (HH:mm), location, color, duration (minutes), description, reminderType ('none', 'minutes', 'hours', 'days'), reminderValue, and repeat ('none', 'daily', 'weekly', 'monthly', 'yearly').",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            date: { type: Type.STRING },
            time: { type: Type.STRING },
            location: { type: Type.STRING },
            color: { type: Type.STRING },
            duration: { type: Type.NUMBER },
            description: { type: Type.STRING },
            reminderType: { type: Type.STRING },
            reminderValue: { type: Type.NUMBER },
            repeat: { type: Type.STRING, description: "One of: none, daily, weekly, monthly, yearly" },
          },
          required: ["name", "date", "time", "location", "color", "duration"],
        },
      },
    });

    if (!response.text) return null;
    return JSON.parse(response.text) as ExtractedEvent;
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return null;
  }
};
