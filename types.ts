
// types.ts

// Updated to Uppercase to match geminiService logic ('STRESSED', etc.)
export type Mood = 'STRESSED' | 'BALANCED' | 'ENERGETIC'; 
export type Language = 'English' | 'Hindi' | 'French' | 'Spanish';
export type Interest = 'None' | 'Minecraft' | 'Marvel' | 'Space' | 'Cricket' | 'Anime';

export interface UserSettings {
  mood: Mood;
  language: Language;
  interest: Interest;
  useMockMode: boolean;
}

export interface MindMapNode {
  id: string;
  label: string;
  description: string;
  parentId?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string; // Changed to string to match AI output (e.g., "Option A" or text)
  explanation?: string; // Made optional as not all prompts return it immediately
  socraticHint: string;
}

export interface Flashcard {
  id: number;
  term: string; // Changed 'front' to 'term' to match service
  definition: string; // Changed 'back' to 'definition' to match service
}

// --- NEW INTERFACE FOR PAPER LEAKER ---
export interface ExamPredictions {
  longAnswer: {
    question: string;
    modelAnswer: string;
    examinerSecret: string; // The "Reasoning" behind the prediction
  };
  shortReasoning: {
    question: string;
    answer: string;
    studentTrap: string; // Renamed 'trap' to 'studentTrap' to match service
  };
  mcq: {
    question: string;
    options: string[];
    correct: string;
    twist: string; // The specific trick in the MCQ
  };
}

export interface AnalysisResult {
  story: {
    title: string;
    narrative: string;
    cheatSheet: string[];
    visualVibe: {
      svg_code: string;
      caption: string;
    };
  };
  mindMap: {
    root: string;
    nodes: MindMapNode[];
  };
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
  examPredictions?: ExamPredictions; // Added the new field
}

// Added 'examleak' for the new tab
export type TabType = 'story' | 'quiz' | 'mindmap' | 'flashcards' | 'examleak';
