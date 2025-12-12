
// types.ts

// Updated to Uppercase to match geminiService logic ('STRESSED', etc.)
export type Mood = 'STRESSED' | 'BALANCED' | 'ENERGETIC'; 
export type Language = 'English' | 'Hindi' | 'French' | 'Spanish';
export type Interest = 'None' | 'Minecraft' | 'Marvel' | 'Space' | 'Cricket' | 'Anime';

export interface UserSettings {
  mood: Mood;
  language: Language;
  interest: Interest;
  // useMockMode: boolean; // Added apiKey
  apiKey: string; 
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
  correctAnswer: string;
  explanation?: string;
  socraticHint: string;
  type: 'Conceptual' | 'Formula' | 'Applied Logic'; // New field for Blind-Spot Hunter
}

export interface Flashcard {
  id: number;
  term: string;
  definition: string;
}

export interface ExamPredictions {
  longAnswer: {
    question: string;
    modelAnswer: string;
    examinerSecret: string;
  };
  shortReasoning: {
    question: string;
    answer: string;
    studentTrap: string;
  };
  mcq: {
    question: string;
    options: string[];
    correct: string;
    twist: string;
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
  examPredictions?: ExamPredictions;
}

export type TabType = 'story' | 'quiz' | 'mindmap' | 'flashcards' | 'examleak' | 'debate';
