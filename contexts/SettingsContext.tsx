
// contexts/SettingsContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Mood, Language, Interest, UserSettings } from '../types';

interface SettingsContextType extends UserSettings {
  setMood: (mood: Mood) => void;
  setLanguage: (lang: Language) => void;
  setInterest: (interest: Interest) => void;
  // setUseMockMode: (useMock: boolean) => void;
  showMoodModal: boolean;
  setShowMoodModal: (show: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mood, setMood] = useState<Mood>('BALANCED');
  const [language, setLanguage] = useState<Language>('English');
  const [interest, setInterest] = useState<Interest>('None');
  // const [useMockMode, setUseMockMode] = useState<boolean>(false);
  const [showMoodModal, setShowMoodModal] = useState(true);

  return (
    <SettingsContext.Provider value={{
      mood, setMood,
      language, setLanguage,
      interest, setInterest,
      // useMockMode, setUseMockMode,
      apiKey: '', // Ignored, using process.env.API_KEY directly
      showMoodModal, setShowMoodModal
    } as any}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
