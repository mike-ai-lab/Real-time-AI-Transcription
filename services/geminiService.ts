import { GoogleGenAI, Modality } from "@google/genai";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates speech from text using Gemini TTS model
 */
export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Fenrir is a deep, calm voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

/**
 * Summarizes text using Gemini Lite model for fast responses
 */
export const summarizeText = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: `Summarize the following text concisely in bullet points:\n\n${text}`,
    });
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Summarization Error:", error);
    throw error;
  }
};

export { ai };