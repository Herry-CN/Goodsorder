
import { GoogleGenAI, Type } from "@google/genai";

// Always use process.env.API_KEY directly for initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * Helps cashier generate product descriptions or data from a simple prompt.
   */
  async suggestProductData(prompt: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `帮我根据输入生成商品信息：${prompt}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
              unit: { type: Type.STRING },
              category: { type: Type.STRING },
              spec: { type: Type.STRING },
            },
            required: ["name", "price", "unit", "category", "spec"]
          },
        },
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error("Gemini suggestion failed:", error);
      return null;
    }
  }
};
