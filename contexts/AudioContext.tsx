import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

type FocusMode = 'OFF' | 'BROWN' | 'RAIN';

interface AudioContextType {
  // TTS (Story Mode)
  isPlaying: boolean;
  text: string;
  speed: number;
  setSpeed: (speed: number) => void;
  playText: (text: string) => void;
  togglePlay: () => void;
  stop: () => void;
  hasAudio: boolean;
  currentCharIndex: number;

  // Focus Sounds
  focusMode: FocusMode;
  setFocusMode: (mode: FocusMode) => void;
  volume: number;
  setVolume: (vol: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- TTS STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [text, setText] = useState('');
  const [speed, setSpeed] = useState(1);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  
  // Refs
  const isSpeakingRef = useRef(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentChunkStartRef = useRef(0);
  
  // Chrome Bug Fix: Store utterance globally to prevent Garbage Collection
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // --- FOCUS SOUND STATE ---
  const [focusMode, setFocusMode] = useState<FocusMode>('OFF');
  const [volume, setVolume] = useState<number>(0.3);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // --- TTS ENGINE ---
  
  const getBestVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    // 1. Try to find a high quality English voice (Google/Microsoft)
    let voice = voices.find(v => v.name.includes("Google") && v.lang.includes("en"));
    // 2. Fallback to any English voice
    if (!voice) voice = voices.find(v => v.lang.startsWith("en"));
    // 3. Fallback to first available
    return voice || voices[0];
  };

  const speak = (textToSpeak: string, rate: number) => {
    // Hard Reset: Cancel everything
    window.speechSynthesis.cancel();
    setIsPlaying(false);

    if (!textToSpeak.trim()) return;

    // Small timeout to let the browser clear the queue
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = rate;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Assign Voice explicitly to prevent "Network" errors
      const voice = getBestVoice();
      if (voice) utterance.voice = voice;

      // Fixed boundary sync as per prompt
      utterance.onboundary = (e) => {
        setCurrentCharIndex(e.charIndex + (currentChunkStartRef.current || 0));
      };

      utterance.onstart = () => {
        setIsPlaying(true);
        isSpeakingRef.current = true;
      };

      utterance.onend = () => {
        setIsPlaying(false);
        isSpeakingRef.current = false;
        setCurrentCharIndex(0);
        activeUtteranceRef.current = null; // Clear ref
      };

      utterance.onerror = (e) => {
        // Ignore "interrupted" errors (happens when we click stop/pause)
        if (e.error === 'interrupted' || e.error === 'canceled') {
          setIsPlaying(false);
          isSpeakingRef.current = false;
          return;
        }
        console.error("TTS Critical Error:", e);
        setIsPlaying(false);
        isSpeakingRef.current = false;
      };

      // CRITICAL CHROME FIX: Keep the object alive
      activeUtteranceRef.current = utterance;
      utteranceRef.current = utterance;
      
      window.speechSynthesis.speak(utterance);
    }, 50); // 50ms delay is the magic number for stability
  };

  // Ensure voices are loaded (Chrome loads them asynchronously)
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const playText = (newText: string) => {
    setText(newText);
    currentChunkStartRef.current = 0;
    speak(newText, speed);
  };

  const togglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      isSpeakingRef.current = false;
    } else {
      // Resume logic: if paused mid-sentence, restart from text
      if (text) {
        speak(text, speed);
      }
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    isSpeakingRef.current = false;
    setCurrentCharIndex(0);
    activeUtteranceRef.current = null;
    currentChunkStartRef.current = 0;
  };

  // Instant Speed Update Logic
  useEffect(() => {
    if (isSpeakingRef.current && text && isPlaying) {
      const timer = setTimeout(() => {
        speak(text, speed);
      }, 100); // Slightly longer delay for speed changes
      return () => clearTimeout(timer);
    }
  }, [speed]);

  // Cleanup
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      stopNoise();
    };
  }, []);


  // --- FOCUS AUDIO ENGINE ---
  const initAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
      const gainNode = audioCtxRef.current.createGain();
      gainNode.connect(audioCtxRef.current.destination);
      gainNodeRef.current = gainNode;
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playGenerativeNoise = (type: 'BROWN' | 'RAIN') => {
    if (!audioCtxRef.current || !gainNodeRef.current) return;
    stopNoise();

    const ctx = audioCtxRef.current;
    const bufferSize = ctx.sampleRate * 5; 
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    if (type === 'BROWN') {
      filter.type = 'lowpass';
      filter.frequency.value = 400; 
    } else {
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
    }

    noiseSource.connect(filter);
    filter.connect(gainNodeRef.current);
    noiseSource.start();
    noiseSourceRef.current = noiseSource;
  };

  const stopNoise = () => {
    if (noiseSourceRef.current) {
      noiseSourceRef.current.stop();
      noiseSourceRef.current.disconnect();
      noiseSourceRef.current = null;
    }
  };

  useEffect(() => {
    if (focusMode !== 'OFF') initAudioContext();
    stopNoise();
    if (focusMode === 'BROWN') playGenerativeNoise('BROWN');
    else if (focusMode === 'RAIN') playGenerativeNoise('RAIN');
  }, [focusMode]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(volume, audioCtxRef.current?.currentTime || 0, 0.1);
    }
  }, [volume]);

  return (
    <AudioContext.Provider value={{
      isPlaying, text, speed, setSpeed, playText, togglePlay, stop, hasAudio: !!text, currentCharIndex,
      focusMode, setFocusMode, volume, setVolume
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
