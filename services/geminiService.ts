
// services/geminiService.ts
import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, UserSettings, Mood, MindMapNode } from '../types';

/**
 * Robust JSON cleaning utility to handle common LLM output issues
 */
const cleanAndParseJSON = (text: string): any => {
  if (!text) throw new Error("Empty response text");

  // 1. Remove markdown code blocks and any preamble/postscript
  let clean = text.replace(/```json\s*|\s*```/g, "").trim();
  
  // 2. Extract text between first {/[ and last }/]
  // We look for both {} and [] to handle both objects and arrays
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
  // We want the outermost character, so we pick the one furthest to the right
  if (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) {
    end = lastBrace;
  } else if (lastBracket !== -1) {
    end = lastBracket;
  }
  
  if (start !== -1 && end !== -1 && end > start) {
    clean = clean.substring(start, end + 1);
  }

  // 3. REPAIR: AI often hallucinates object keys in arrays, e.g., "1": { ... }
  // We remove the "key": part to keep just the object.
  clean = clean.replace(/"\d+":\s*{/g, '{');

  try {
    return JSON.parse(clean);
  } catch (e: any) {
    // 4. Attempt fix for trailing commas before closing braces/brackets
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
 * Exponential backoff retry wrapper for API calls
 */
const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const isQuotaError = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');
    if (retries > 0 && isQuotaError) {
      console.warn(`Quota exceeded. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
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
    reader.readAsDataURL(file);
  });
}

const MOCK_DATA: AnalysisResult = {
  story: {
    title: "The HERIC Circuit: The Cricket Team of Inverters",
    narrative: "Let's learn about the HERIC circuit! First, breathe in, hold for a moment, and breathe out slowly. Think of a cricket team (the circuit). The HERIC, or Highly Efficient and Reliable Inverter Concept, is like a star all-rounder.\n\nImagine a cricket match. Sometimes, the team needs to score runs quickly (positive state). Switches S1 and S2 are like batsmen hitting boundaries! When the game pauses (zero state), only the wicket-keeper S5 is active, stopping any extra runs (leakage current). The other players (S1, S2, S3, S4) rest. HERIC needs more players (switches), so it's like having a bigger team, which might cost more to maintain. But during the pause, HERIC and another circuit (H5) have the same number of players actively stopping runs, so they perform equally well! When scoring (active state), HERIC has the bowler (S1) delivering the ball and it coming back via another player (S2). In another version (H5), three players are involved. It might use slightly more energy, but that's the basic idea!",
    cheatSheet: [
      "HERIC: Efficient circuit using switches.",
      "Positive State: S1 & S2 ON.",
      "Zero State: S5 ON, stops leakage."
    ],
    visualVibe: {
      svg_code: "<svg viewBox='0 0 500 300' xmlns='http://www.w3.org/2000/svg'><rect width='500' height='300' fill='#f9fafb'/><line x1='150' y1='150' x2='350' y2='150' stroke='#3b82f6' stroke-width='4'/><circle cx='150' cy='150' r='50' fill='#10b981'/><text x='150' y='155' font-family='Arial' font-size='20' fill='white' text-anchor='middle' font-weight='bold'>HERIC</text><circle cx='350' cy='150' r='50' fill='#ef4444'/><text x='350' y='155' font-family='Arial' font-size='20' fill='white' text-anchor='middle' font-weight='bold'>CRICKET</text><text x='250' y='250' font-family='Arial' font-size='14' fill='#6b7280' text-anchor='middle'>Energy Flow (Runs Scored)</text></svg>",
      caption: "HERIC Circuit vs Cricket Team Analogy"
    }
  },
  mindMap: {
    root: "HERIC Circuit",
    nodes: [
      { id: "1", label: "Positive State", description: "Current flows through S1 and S2 (The Batsmen). This is when power is actively generated.", parentId: "root" },
      { id: "2", label: "Zero State", description: "Freewheeling state where S5 conducts (The Wicket Keeper). This disconnects the source.", parentId: "root" },
      { id: "3", label: "Switches", description: "Uses multiple switches (IGBTs/MOSFETs) to control the precise energy flow paths.", parentId: "root" },
      { id: "4", label: "Leakage Current", description: "Minimizes leakage current to improve safety and efficiency of the overall system.", parentId: "root" },
      { id: "5", label: "Efficiency", description: "High efficiency by decoupling AC and DC sides during zero states.", parentId: "root" }
    ]
  },
  quiz: [
    {
      id: 1,
      question: "In the positive state of a HERIC circuit, which switches are ON?",
      options: ["S1 and S2", "S3 and S4", "S5 only", "None"],
      correctAnswer: "S1 and S2",
      socraticHint: "Remember the analogy! Who are the batsmen scoring the runs in the active phase?"
    },
    {
      id: 2,
      question: "What is the main role of the 'Zero State'?",
      options: ["To generate heat", "To stop leakage current", "To increase voltage", "To shut down the system"],
      correctAnswer: "To stop leakage current",
      socraticHint: "Think of the wicket-keeper pausing the game to stop extra runs."
    },
    {
      id: 3,
      question: "Why is HERIC considered efficient?",
      options: ["It uses fewer switches", "It decouples AC and DC sides", "It is cheaper", "It requires no cooling"],
      correctAnswer: "It decouples AC and DC sides",
      socraticHint: "Efficiency comes from separating the source from the load when not needed."
    }
  ],
  flashcards: [
    { id: 1, term: "HERIC", definition: "Highly Efficient and Reliable Inverter Concept." },
    { id: 2, term: "Zero State", definition: "The 'Pause' mode where Switch S5 stops leakage." },
    { id: 3, term: "Leakage Current", definition: "Wasted energy flowing to ground." },
    { id: 4, term: "Positive State", definition: "Active power generation phase." }
  ],
  examPredictions: {
    longAnswer: {
      question: "Explain the operation modes of HERIC topology with circuit diagrams. Why is it preferred over H5?",
      modelAnswer: "1. Define HERIC. 2. Explain Positive Cycle (S1, S2). 3. Explain Freewheeling (S5). 4. Compare conduction losses.",
      examinerSecret: "I selected this because 80% of students forget to draw the 'Freewheeling Path'. If you miss S5, you lose 3 marks instantly."
    },
    shortReasoning: {
      question: "Why is leakage current a critical issue in transformerless inverters?",
      answer: "It causes safety hazards and electromagnetic interference (EMI).",
      studentTrap: "Don't just say 'it's dangerous'. You MUST mention 'Common Mode Voltage' to get full marks."
    },
    mcq: {
      question: "Which component is primarily responsible for decoupling AC and DC sides in HERIC?",
      options: ["The DC Link Capacitor", "The AC Switch (S5/S6)", "The Inductor", "The Diode"],
      correct: "The AC Switch (S5/S6)",
      twist: "Option A is a distractor. The Capacitor filters, but the SWITCH physically disconnects."
    }
  }
};

export const analyzeImage = async (
  file: File, 
  settings: UserSettings
): Promise<AnalysisResult> => {
  if (settings.useMockMode) {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_DATA), 2000));
  }

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

    Return ONLY raw JSON. Do NOT use Markdown code blocks. 
    Ensure the JSON is perfectly valid. Do NOT use index keys in arrays (e.g., "1": {}).
    
    Structure: {
      "story": { "title": "...", "narrative": "...", "cheatSheet": [], "visualVibe": { "svg_code": "...", "caption": "..." } },
      "mindMap": { 
        "root": "Main Topic", 
        "nodes": [ 
          { "id": "1", "label": "Sub-concept 1", "description": "3-line detailed summary.", "parentId": "root" } 
        ] 
      },
      "quiz": [ { "id": 1, "question": "...", "options": [], "correctAnswer": "...", "socraticHint": "..." } ],
      "flashcards": [ { "id": 1, "term": "...", "definition": "..." } ],
      "examPredictions": { "longAnswer": { "question": "...", "modelAnswer": "...", "examinerSecret": "..." }, "shortReasoning": { "question": "...", "answer": "...", "studentTrap": "..." }, "mcq": { "question": "...", "options": [], "correct": "...", "twist": "..." } }
    }

    IMPORTANT: For the Mind Map, generate strictly 5-6 primary sub-concepts only. Ensure ALL generated nodes have parentId: 'root'. This prevents initial clutter.`;

    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: systemPrompt }, base64Part] },
      config: { responseMimeType: "application/json" }
    }));
    
    const text = response.text;
    if (!text) throw new Error("No content generated.");
    return cleanAndParseJSON(text) as AnalysisResult;

  } catch (error: any) {
    if (error.message?.includes('429')) {
      throw new Error("Quota exceeded. Please wait a moment or switch to a paid API key in settings.");
    }
    throw new Error(error.message || "Failed to generate content");
  }
};

export const defineWord = async (word: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await withRetry(() => ai.models.generateContent({
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
  const prompt = `Return strictly raw JSON with the following key: {"hint": "..."}. Context: Quiz on "${topic}". Question: "${question}". Wrong: "${wrongAnswer}". Correct: "${correctAnswer}". Give a short Socratic hint.`;
  try {
    const response = await withRetry(() => ai.models.generateContent({
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

export const expandMindMapNode = async (
  rootTopic: string,
  nodeLabel: string,
  nodeId: string,
  useMockMode: boolean
): Promise<MindMapNode[]> => {
  if (useMockMode) {
    return new Promise((resolve) => setTimeout(() => resolve([
      { id: `${nodeId}-1`, label: `Details of ${nodeLabel}`, description: `Deep dive into ${nodeLabel}.`, parentId: nodeId },
      { id: `${nodeId}-2`, label: `Functions of ${nodeLabel}`, description: `The primary functions and operational characteristics of ${nodeLabel}.`, parentId: nodeId },
      { id: `${nodeId}-3`, label: `Types of ${nodeLabel}`, description: `Various classifications and variations found in ${nodeLabel} implementations.`, parentId: nodeId }
    ]), 1000));
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Root Topic: "${rootTopic}". Sub-Topic: "${nodeLabel}". Create a sub-layer JSON array. 
  Generate exactly 3-4 specific sub-nodes that expand on this concept.
  Return strictly RAW JSON ONLY. No markdown. No index keys.
  Structure: [ { "id": "${nodeId}-X", "label": "...", "description": "...", "parentId": "${nodeId}" } ]`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    }));
    return cleanAndParseJSON(response.text || "[]") as MindMapNode[];
  } catch (e: any) {
    console.error("Expansion Error", e);
    return [];
  }
};

export const getVivaResponse = async (
  userQuery: string,
  context: string,
  mood: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Context: "${context}". Question: "${userQuery}". Mood: "${mood}". Return JSON: {"response": "..."}. Conversational English tutor, 2-3 sentences.`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
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
