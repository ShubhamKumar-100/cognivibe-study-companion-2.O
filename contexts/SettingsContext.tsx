import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Mood, Language, Interest, UserSettings } from '../types';

interface SettingsContextType extends UserSettings {
  apiKey: string;
  setApiKey: (key: string) => void;
  setMood: (mood: Mood) => void;
  setLanguage: (lang: Language) => void;
  setInterest: (interest: Interest) => void;
  setUseMockMode: (useMock: boolean) => void;
  showMoodModal: boolean;
  setShowMoodModal: (show: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });
  const [mood, setMood] = useState<Mood>('BALANCED');
  const [language, setLanguage] = useState<Language>('English');
  const [interest, setInterest] = useState<Interest>('None');
  const [useMockMode, setUseMockMode] = useState<boolean>(false);
  const [showMoodModal, setShowMoodModal] = useState(true);

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    localStorage.setItem('gemini_api_key', key);
  };

  return (
    <SettingsContext.Provider value={{
      apiKey, setApiKey,
      mood, setMood,
      language, setLanguage,
      interest, setInterest,
      useMockMode, setUseMockMode,
      showMoodModal, setShowMoodModal
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};