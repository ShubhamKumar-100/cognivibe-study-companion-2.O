import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

interface AudioContextType {
  isPlaying: boolean;
  text: string;
  speed: number;
  setSpeed: (speed: number) => void;
  playText: (text: string) => void;
  togglePlay: () => void;
  stop: () => void;
  hasAudio: boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [text, setText] = useState('');
  const [speed, setSpeed] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const playText = (newText: string) => {
    window.speechSynthesis.cancel();
    setText(newText);
    
    const utterance = new SpeechSynthesisUtterance(newText);
    utterance.rate = speed;
    utterance.onend = () => setIsPlaying(false);
    utteranceRef.current = utterance;
    
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else if (text) {
        playText(text);
      }
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  // Update speed on the fly
  useEffect(() => {
    if (isPlaying && utteranceRef.current) {
        // SpeechSynthesis API doesn't support changing rate mid-speech reliably across browsers
        // It's safer to cancel and restart at the new speed if needed, or just apply to next
        // For simplicity in this demo, we apply to next play or restart
        window.speechSynthesis.cancel();
        playText(text);
    }
  }, [speed]);

  return (
    <AudioContext.Provider value={{
      isPlaying,
      text,
      speed,
      setSpeed,
      playText,
      togglePlay,
      stop,
      hasAudio: !!text
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
};