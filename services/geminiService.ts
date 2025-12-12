
// services/geminiService.ts
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AnalysisResult, UserSettings, Mood, MindMapNode, QuizQuestion } from '../types';

/**
 * Robust JSON cleaning utility to handle common LLM output issues
 */
const cleanAndParseJSON = (text: string): any => {
  if (!text) throw new Error("Empty response text");

  let clean = text.replace(/```json\s*|\s*```/g, "").trim();
  
  const firstBrace = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');
  const lastBrace = clean.lastIndexOf('}');
  const lastBracket = clean.lastIndexOf(']');

  let start = -1;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket;
  }

  let end = -1;
  if (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) {
    end = lastBrace;
  } else if (lastBracket !== -1) {
    end = lastBracket;
  }
  
  if (start !== -1 && end !== -1 && end > start) {
    clean = clean.substring(start, end + 1);
  }

  clean = clean.replace(/"\d+":\s*{/g, '{');

  try {
    return JSON.parse(clean);
  } catch (e: any) {
    try {
      const fixedJson = clean
        .replace(/,\s*([}\]])/g, '$1') 
        .trim();
      return JSON.parse(fixedJson);
    } catch (e2) {
      console.error("JSON Parse Critical Failure. Raw Text:", text);
      console.error("Cleaned Text Segment:", clean);
      throw new Error(`AI generated malformed JSON: ${e.message}`);
    }
  }
};

/**
 * Enhanced retry logic for handling 429 (Rate Limit) and 500 (Internal) errors
 */
const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error.message?.toLowerCase() || "";
    const isRetryable = errorMsg.includes('429') || 
                       errorMsg.includes('resource_exhausted') || 
                       errorMsg.includes('500') || 
                       errorMsg.includes('internal error');

    if (retries > 0 && isRetryable) {
      const waitTime = errorMsg.includes('429') ? delay : delay / 2;
      console.warn(`Gemini API Error. Retrying in ${waitTime}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    // Fix: Corrected method name from readAsAsDataURL to readAsDataURL
    reader.readAsDataURL(file);
  });
}

export const analyzeImage = async (
  file: File, 
  settings: UserSettings
): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const base64Part = await fileToGenerativePart(file);
    
    let moodInstruction = "";
    if (settings.mood === 'STRESSED') {
      moodInstruction = "Tone: Gentle, comforting, ultra-simple (ELI5). Start with a breathing tip.";
    } else if (settings.mood === 'ENERGETIC') {
      moodInstruction = "Tone: Enthusiastic, high-energy. Include 'Did you know?' facts and challenges.";
    } else {
      moodInstruction = "Tone: Professional but friendly.";
    }

    const systemPrompt = `
    You are 'CogniVibe', an expert Special Education Tutor and a "Senior Board Examiner" with 20 years of experience.
    1. Analyze the uploaded input.
    2. User Interest: "${settings.interest}". Use this for analogies.
    3. ${moodInstruction}

    Return ONLY raw JSON in English. Do NOT use Markdown code blocks. 
    Ensure the JSON is perfectly valid. Do NOT use index keys in arrays.
    
    Structure: {
      "story": { "title": "...", "narrative": "...", "cheatSheet": [], "visualVibe": { "svg_code": "...", "caption": "..." } },
      "mindMap": { 
        "root": "Main Topic", 
        "nodes": [ 
          { "id": "1", "label": "Sub-concept 1", "description": "3-line detailed summary.", "parentId": "root" } 
        ] 
      },
      "quiz": [ 
        { 
          "id": 1, 
          "question": "...", 
          "options": [], 
          "correctAnswer": "...", 
          "socraticHint": "...",
          "type": "Conceptual" // One of: Conceptual, Formula, Applied Logic
        } 
      ],
      "flashcards": [ { "id": 1, "term": "...", "definition": "..." } ],
      "examPredictions": { "longAnswer": { "question": "...", "modelAnswer": "...", "examinerSecret": "..." }, "shortReasoning": { "question": "...", "answer": "...", "studentTrap": "..." }, "mcq": { "question": "...", "options": [], "correct": "...", "twist": "..." } }
    }

    IMPORTANT: 
    - Generate EXACTLY 6 questions for the quiz.
    - Mix categories: 2 Conceptual, 2 Formula, 2 Applied Logic.
    - For the Mind Map, generate strictly 5-6 primary sub-concepts only. Ensure ALL generated nodes have parentId: 'root'.`;

    // Fix: Added explicit GenerateContentResponse typing for the withRetry return value
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: systemPrompt }, base64Part] },
      config: { responseMimeType: "application/json" }
    }));
    
    const text = response.text;
    if (!text) throw new Error("No content generated.");
    return cleanAndParseJSON(text) as AnalysisResult;

  } catch (error: any) {
    if (error.message?.includes('429')) {
      throw new Error("API Quota exceeded. Please wait a moment.");
    }
    throw new Error(error.message || "Failed to generate content");
  }
};

export const getAdvancedQuiz = async (topic: string): Promise<QuizQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Context: The user has mastered the basics of '${topic}'. 
  Task: Generate 5 NEW, ADVANCED level questions (Application & Analysis level). 
  Focus on Math, Logic, and Tricky Edge Cases. 
  Return ONLY raw JSON as an array of 5 questions. Do NOT use Markdown.
  Structure: [
    { 
      "id": 1, 
      "question": "...", 
      "options": ["A", "B", "C", "D"], 
      "correctAnswer": "...", 
      "explanation": "Brief reasoning",
      "socraticHint": "...",
      "type": "Applied Logic"
    }
  ]`;

  try {
    // Fix: Added explicit GenerateContentResponse typing
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    }));
    const text = response.text;
    return cleanAndParseJSON(text || "[]") as QuizQuestion[];
  } catch (e: any) {
    console.error("Advanced Quiz Fetch Failed", e);
    throw new Error("Could not fetch advanced questions. " + (e.message || "Please try again later."));
  }
};

export const defineWord = async (word: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    // Fix: Added explicit GenerateContentResponse typing
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Return strictly raw JSON with the following key: {"definition": "..."}. Define "${word}" in 1 simple sentence for a student.`,
      config: { responseMimeType: "application/json" }
    }));
    const parsed = cleanAndParseJSON(response.text || "{}");
    return parsed.definition || "Definition unavailable.";
  } catch (e) {
    return "Definition unavailable.";
  }
};

export const generateHint = async (
  question: string, 
  wrongAnswer: string, 
  correctAnswer: string, 
  topic: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Return strictly raw JSON with the following key: {"hint": "..."}. Context: Quiz on "${topic}". Question: "${question}". Wrong: "${wrongAnswer}". Correct: "${correctAnswer}". Give a short Socratic hint in English.`;
  try {
    // Fix: Added explicit GenerateContentResponse typing
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    }));
    const parsed = cleanAndParseJSON(response.text || "{}");
    return parsed.hint || "Try reviewing the Story Mode for clues!";
  } catch (e) {
    return "Try reviewing the Story Mode for clues!";
  }
};

// Fix: Removed unused useMockMode parameter from expandMindMapNode function signature.
export const expandMindMapNode = async (
  rootTopic: string,
  nodeLabel: string,
  nodeId: string
): Promise<MindMapNode[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Root Topic: "${rootTopic}". Sub-Topic: "${nodeLabel}". Create a sub-layer JSON array in English. 
  Generate exactly 3-4 specific sub-nodes that expand on this concept.
  Return strictly RAW JSON ONLY. No markdown. No index keys.
  Structure: [ { "id": "${nodeId}-X", "label": "...", "description": "...", "parentId": "${nodeId}" } ]`;

  try {
    // Fix: Added explicit GenerateContentResponse typing
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    }));
    return cleanAndParseJSON(response.text || "[]") as MindMapNode[];
  } catch (e: any) {
    console.error("Expansion Error", e);
    throw new Error(e.message || "Failed to expand node.");
  }
};

export const getVivaResponse = async (
  userQuery: string,
  context: string,
  mood: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Context: "${context}". Question: "${userQuery}". Mood: "${mood}". Return JSON: {"response": "..."}. Conversational English tutor, 2-3 sentences. Use English.`;

  try {
    // Fix: Added explicit GenerateContentResponse typing
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    }));
    const parsed = cleanAndParseJSON(response.text || "{}");
    return parsed.response || "Sorry, I couldn't get a response.";
  } catch (error) {
    return "Oops! An error occurred. Check your network or quota.";
  }
};

export const getDebateResponse = async (
  userArgument: string, 
  topic: string, 
  history: any[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemPrompt = `You are a skilled 'Devil's Advocate' and Debater.
    Topic: ${topic}
    Role: Challenge the user's understanding. Find logical gaps in their argument. Be competitive but educational.
    Constraint: Keep responses short (2-3 sentences) and punchy for audio playback.
    Goal: Force the user to defend the concept using deep reasoning.`;

  try {
    // Fix: Added explicit GenerateContentResponse typing
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `Topic is ${topic}. Defend your stance: ${userArgument}` }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json"
      }
    }));
    
    const parsed = cleanAndParseJSON(response.text || "{}");
    // Fix: Explicitly accessing .text property
    return parsed.response || parsed.rebuttal || response.text || "Interesting point, but is that always true?";
  } catch (error) {
    return "I see your point, but let's look closer at the core logic.";
  }
};
