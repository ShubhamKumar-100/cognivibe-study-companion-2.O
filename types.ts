export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // Index
  explanation: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  description: string;
  children?: MindMapNode[];
}

export interface Flashcard {
  id: number;
  front: string;
  back: string;
}

export interface AnalysisResult {
  story: string;
  cheatSheet: string[];
  quiz: QuizQuestion[];
  mindMap: MindMapNode;
  flashcards: Flashcard[];
}

export type TabType = 'story' | 'quiz' | 'mindmap' | 'flashcards';

export interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

export type Mood = 'stressed' | 'okay' | 'energetic';
export type Language = 'English' | 'Hindi' | 'French' | 'Spanish';
export type Interest = 'None' | 'Minecraft' | 'Marvel' | 'Space' | 'Cricket' | 'Anime';

export interface UserSettings {
  mood: Mood;
  language: Language;
  interest: Interest;
}