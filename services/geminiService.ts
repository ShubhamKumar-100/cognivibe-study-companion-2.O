import { GoogleGenAI, Type, SchemaShared } from "@google/genai";
import { AnalysisResult, UserSettings } from '../types';

// Helper to convert file to base64
const fileToPart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeImage = async (file: File, settings: UserSettings, apiKey: string): Promise<AnalysisResult> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please set it in Settings.");
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const imagePart = await fileToPart(file);
  
  // Construct dynamic instruction based on settings
  let toneInstruction = "professional and educational";
  if (settings.mood === 'stressed') toneInstruction = "gentle, reassuring, and calm";
  if (settings.mood === 'energetic') toneInstruction = "high-energy, gamified, and exciting";

  let analogyInstruction = "";
  if (settings.interest && settings.interest !== 'None') {
    analogyInstruction = ` Use analogies specifically related to ${settings.interest} to explain concepts.`;
  }

  const systemPrompt = `You are an expert Special Education Tutor. Tone: ${toneInstruction}. Language: ${settings.language}.
  Analyze the uploaded image. Output a JSON object containing:
  - \`story\`: A creative narrative explanation.${analogyInstruction}
  - \`quiz\`: 3 interactive questions with options and explanations.
  - \`flashcards\`: 4 key terms and definitions for active recall.
  - \`mindMap\`: A central concept with connected sub-concepts (max depth 2) for a radial diagram. Each node must have a \`label\` and a \`description\`.
  - \`cheatSheet\`: 3 ultra-short bullet points (TL;DR).
  
  Ensure ALL content is in ${settings.language}.`;

  // Explicitly typed schema to ensure structure
  const mindMapSchema: SchemaShared = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      label: { type: Type.STRING },
      description: { type: Type.STRING },
      children: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            label: { type: Type.STRING },
            description: { type: Type.STRING },
            children: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro-latest',
      contents: {
        parts: [
          imagePart,
          { text: "Analyze the uploaded image based on the system instructions." }
        ]
      },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            story: { type: Type.STRING },
            cheatSheet: { type: Type.ARRAY, items: { type: Type.STRING } },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.INTEGER },
                  explanation: { type: Type.STRING }
                }
              }
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  front: { type: Type.STRING },
                  back: { type: Type.STRING }
                }
              }
            },
            mindMap: mindMapSchema
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("Gemini API returned an empty response.");
    }

    return JSON.parse(response.text);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Detailed error extraction
    let errorMessage = "Unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Check for common 400/401/429/500 patterns in stringified error
    const errStr = JSON.stringify(error);
    if (errStr.includes("400")) errorMessage = `Error 400: Bad Request. ${errorMessage}`;
    if (errStr.includes("401") || errStr.includes("PERMISSION_DENIED")) errorMessage = "Error 401: Invalid API Key. Please check your key in Settings.";
    if (errStr.includes("429")) errorMessage = "Error 429: Quota Exceeded. You are sending requests too fast.";
    if (errStr.includes("500")) errorMessage = "Error 500: Internal Server Error at Google.";

    throw new Error(errorMessage);
  }
};