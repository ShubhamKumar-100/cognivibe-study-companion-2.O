import React, { useState, useEffect } from 'react';
import { Accessibility, Eye, Brain, Check, Play, Pause, RotateCcw, X } from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext';

const AccessibilityToolbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    dyslexiaFont, setDyslexiaFont,
    bionicReading, setBionicReading,
    readingRuler, setReadingRuler,
    microChunking, setMicroChunking,
    zenMode, setZenMode
  } = useAccessibility();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 bg-panel border border-gray-700 rounded-xl shadow-2xl p-4 w-72 animate-slideUp">
          <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Accessibility size={20} className="text-accent" /> Access Tools
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Dyslexia Tools */}
          <div className="mb-4">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
              <Eye size={12} /> Dyslexia Tools
            </h4>
            <div className="space-y-2">
              <Toggle label="Dyslexia Font" active={dyslexiaFont} onClick={() => setDyslexiaFont(!dyslexiaFont)} />
              <Toggle label="Bionic Reading" active={bionicReading} onClick={() => setBionicReading(!bionicReading)} />
              <Toggle label="Reading Ruler" active={readingRuler} onClick={() => setReadingRuler(!readingRuler)} />
            </div>
          </div>

          {/* ADHD Tools */}
          <div className="mb-4">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
              <Brain size={12} /> ADHD Tools
            </h4>
            <div className="space-y-2">
              <Toggle label="Micro-Chunking" active={microChunking} onClick={() => setMicroChunking(!microChunking)} />
              <Toggle label="Zen Mode" active={zenMode} onClick={() => setZenMode(!zenMode)} />
            </div>
          </div>

          {/* Focus Timer */}
          <FocusTimer />
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-accent hover:bg-accent-hover text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 font-bold transition-transform active:scale-95"
      >
        <Accessibility size={20} />
        {isOpen ? 'Close Tools' : 'Access Tools'}
      </button>
    </div>
  );
};

const Toggle: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
      active ? 'bg-accent/20 text-accent border border-accent/50' : 'bg-gray-700/30 text-gray-300 border border-transparent hover:bg-gray-700'
    }`}
  >
    <span>{label}</span>
    {active && <Check size={16} />}
  </button>
);

const FocusTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: number | null = null;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Optional: Play alarm
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const reset = () => {
    setIsActive(false);
    setTimeLeft(10 * 60);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-text-muted uppercase">Focus Timer</span>
        <span className="font-mono text-xl text-white font-bold">{formatTime(timeLeft)}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-bold text-white transition-colors ${isActive ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {isActive ? <Pause size={12} /> : <Play size={12} />}
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={reset}
          className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-md text-white transition-colors"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
};

export default AccessibilityToolbar;