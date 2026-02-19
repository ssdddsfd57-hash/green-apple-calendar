
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedEvent } from "../types";
import { format } from "date-fns";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const extractEventFromImage = async (base64Image: string): Promise<ExtractedEvent | null> => {
  try {
    const mimeMatch = base64Image.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64Data = base64Image.split(',')[1] || base64Image;

    const today = format(new Date(), 'yyyy-MM-dd, EEEE');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // 切换到 Flash 模型，追求极致速度
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            {
              text: `提取日历事件 JSON。参考时间：${today}。
              规则：
              1. 计算“明天/周几”到具体日期。
              2. 选颜色：bg-lime-400, bg-green-400, bg-orange-400, bg-sky-400, bg-purple-400。
              3. duration 为分钟。
              格式：{name, date, time, location, color, duration, description, repeat}`,
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
            repeat: { type: Type.STRING },
          },
          required: ["name", "date", "time", "location", "color"],
        },
      },
    });

    if (!response.text) return null;
    return JSON.parse(response.text) as ExtractedEvent;
  } catch (error) {
    console.error("Fast Extraction Error:", error);
    return null;
  }
};
