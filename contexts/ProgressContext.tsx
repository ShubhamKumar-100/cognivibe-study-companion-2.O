
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProgressContextType {
  topic: string;
  setTopic: (t: string) => void;
  score: number;
  setScore: (s: number) => void;
  totalQuestions: number;
  setTotalQuestions: (t: number) => void;
  weakestCategory: string;
  setWeakestCategory: (c: string) => void;
  sessionStartTime: number;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [topic, setTopic] = useState('No Topic Loaded');
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [weakestCategory, setWeakestCategory] = useState('');
  const [sessionStartTime] = useState(Date.now());

  return (
    <ProgressContext.Provider value={{
      topic, setTopic,
      score, setScore,
      totalQuestions, setTotalQuestions,
      weakestCategory, setWeakestCategory,
      sessionStartTime
    }}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) throw new Error('useProgress must be used within ProgressProvider');
  return context;
};
