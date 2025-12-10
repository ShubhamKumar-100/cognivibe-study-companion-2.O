import React, { createContext, useContext, useState, ReactNode } from 'react';

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
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [bionicReading, setBionicReading] = useState(false);
  const [readingRuler, setReadingRuler] = useState(false);
  const [microChunking, setMicroChunking] = useState(false);
  const [zenMode, setZenMode] = useState(false);

  return (
    <AccessibilityContext.Provider value={{
      dyslexiaFont, setDyslexiaFont,
      bionicReading, setBionicReading,
      readingRuler, setReadingRuler,
      microChunking, setMicroChunking,
      zenMode, setZenMode
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