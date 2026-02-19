
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedEvent } from "../types";
import { format } from "date-fns";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const extractEventFromImage = async (base64Image: string): Promise<ExtractedEvent | null> => {
  try {
    // 确保提取的是纯 base64 数据
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const mimeMatch = base64Image.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const today = format(new Date(), 'yyyy-MM-dd, EEEE');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
              text: `你是一个日历专家。从这张照片（可能是截图或实拍）中提取事件信息。
              
              【参考时间】：今天是 ${today}。
              
              【输出要求】：
              1. 如果提到“明天/周几”，请根据参考时间推算具体日期。
              2. 颜色选一个：bg-lime-400, bg-green-400, bg-orange-400, bg-sky-400, bg-purple-400。
              3. 返回严格的 JSON 格式。
              
              JSON 格式：{ "name": "", "date": "YYYY-MM-DD", "time": "HH:mm", "location": "", "color": "", "duration": 60, "description": "", "repeat": "none" }`,
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

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as ExtractedEvent;
  } catch (error) {
    console.error("Extraction Error:", error);
    return null;
  }
};
