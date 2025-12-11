import React, { createContext, useContext, useState, ReactNode } from 'react';

export type BackgroundTint = 'default' | 'sepia' | 'blue' | 'black';

interface AccessibilityContextType {
  dyslexiaFont: boolean;
  setDyslexiaFont: (v: boolean) => void;
  bionicReading: boolean;
  setBionicReading: (v: boolean) => void;
  readingRuler: boolean;
  setReadingRuler: (v: boolean) => void;
  microChunking: boolean;
  setMicroChunking: (v: boolean) => void;
  zenMode: boolean;
  setZenMode: (v: boolean) => void;
  // New Visual Comfort State
  syllableBreakdown: boolean;
  setSyllableBreakdown: (v: boolean) => void;
  bgTint: BackgroundTint;
  setBgTint: (v: BackgroundTint) => void;
  lineSpacing: number;
  setLineSpacing: (v: number) => void;
  resetAll: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [bionicReading, setBionicReading] = useState(false);
  const [readingRuler, setReadingRuler] = useState(false);
  const [microChunking, setMicroChunking] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  
  // New State
  const [syllableBreakdown, setSyllableBreakdown] = useState(false);
  const [bgTint, setBgTint] = useState<BackgroundTint>('default');
  const [lineSpacing, setLineSpacing] = useState(1.6); // Default comfortable spacing

  const resetAll = () => {
    setDyslexiaFont(false);
    setBionicReading(false);
    setReadingRuler(false);
    setMicroChunking(false);
    setZenMode(false);
    setSyllableBreakdown(false);
    setBgTint('default');
    setLineSpacing(1.6);
  };

  return (
    <AccessibilityContext.Provider value={{
      dyslexiaFont, setDyslexiaFont,
      bionicReading, setBionicReading,
      readingRuler, setReadingRuler,
      microChunking, setMicroChunking,
      zenMode, setZenMode,
      syllableBreakdown, setSyllableBreakdown,
      bgTint, setBgTint,
      lineSpacing, setLineSpacing,
      resetAll
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return context;
};