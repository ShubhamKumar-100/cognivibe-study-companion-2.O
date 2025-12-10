import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Mood, Language, Interest, UserSettings } from '../types';

interface SettingsContextType extends UserSettings {
  setMood: (mood: Mood) => void;
  setLanguage: (lang: Language) => void;
  setInterest: (interest: Interest) => void;
  showMoodModal: boolean;
  setShowMoodModal: (show: boolean) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mood, setMood] = useState<Mood>('okay');
  const [language, setLanguage] = useState<Language>('English');
  const [interest, setInterest] = useState<Interest>('None');
  const [showMoodModal, setShowMoodModal] = useState(true);
  
  // Initialize from localStorage if available
  const [apiKey, setApiKeyState] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    localStorage.setItem('gemini_api_key', key);
  };

  return (
    <SettingsContext.Provider value={{
      mood, setMood,
      language, setLanguage,
      interest, setInterest,
      showMoodModal, setShowMoodModal,
      apiKey, setApiKey
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