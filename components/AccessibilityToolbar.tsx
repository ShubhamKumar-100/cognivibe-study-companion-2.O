import React, { useState, useEffect } from 'react';
import { Accessibility, Eye, Brain, Check, Play, Pause, RotateCcw, X, Palette, Type } from 'lucide-react';
import { useAccessibility, BackgroundTint } from '../contexts/AccessibilityContext';

const AccessibilityToolbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    dyslexiaFont, setDyslexiaFont,
    bionicReading, setBionicReading,
    readingRuler, setReadingRuler,
    microChunking, setMicroChunking,
    zenMode, setZenMode,
    syllableBreakdown, setSyllableBreakdown,
    bgTint, setBgTint,
    lineSpacing, setLineSpacing,
    resetAll
  } = useAccessibility();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-5 w-80 animate-slideUp max-h-[85vh] overflow-y-auto custom-scrollbar text-gray-900 dark:text-gray-100 z-[100]">
          <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-3">
            <h3 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <Accessibility size={20} className="text-accent" /> Access Tools
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* ADHD Tools */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Brain size={14} /> ADHD Focus Tools
            </h4>
            <div className="space-y-2.5">
              <Toggle label="Micro-Chunking" active={microChunking} onClick={() => setMicroChunking(!microChunking)} />
              <Toggle label="Zen Focus Mode" active={zenMode} onClick={() => setZenMode(!zenMode)} />
              <FocusTimer />
            </div>
          </div>

          {/* Dyslexia Tools */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Eye size={14} /> Dyslexia Tools
            </h4>
            <div className="space-y-2.5">
              <Toggle label="Dyslexia Font" active={dyslexiaFont} onClick={() => setDyslexiaFont(!dyslexiaFont)} />
              <Toggle label="Bionic Reading" active={bionicReading} onClick={() => setBionicReading(!bionicReading)} />
              <Toggle label="Syllable Breakdown" active={syllableBreakdown} onClick={() => setSyllableBreakdown(!syllableBreakdown)} />
              <Toggle label="Reading Ruler" active={readingRuler} onClick={() => setReadingRuler(!readingRuler)} />
            </div>
          </div>

          {/* Visual Comfort */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Palette size={14} /> Visual Comfort
            </h4>
            
            {/* Tint Selection */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 mb-3">
               <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">Background Tint</span>
               <div className="flex justify-between gap-2">
                  <TintButton color="default" active={bgTint === 'default'} onClick={() => setBgTint('default')} label="Dark" />
                  <TintButton color="sepia" active={bgTint === 'sepia'} onClick={() => setBgTint('sepia')} label="Sepia" />
                  <TintButton color="blue" active={bgTint === 'blue'} onClick={() => setBgTint('blue')} label="Blue" />
                  <TintButton color="black" active={bgTint === 'black'} onClick={() => setBgTint('black')} label="Black" />
               </div>
            </div>

            {/* Line Spacing */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
               <div className="flex justify-between mb-1">
                 <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"><Type size={12}/> Line Spacing</span>
                 <span className="text-xs font-mono text-accent">{lineSpacing.toFixed(1)}</span>
               </div>
               <input 
                  type="range" 
                  min="1.0" 
                  max="2.5" 
                  step="0.1" 
                  value={lineSpacing}
                  onChange={(e) => setLineSpacing(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-accent"
               />
            </div>
          </div>

          <button 
            onClick={resetAll}
            className="w-full py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={12} /> Reset All Settings
          </button>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-accent hover:bg-accent-hover text-white px-5 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold transition-transform active:scale-95 border-2 border-white/10"
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
    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 border ${
      active 
        ? 'bg-accent border-accent text-white shadow-md' 
        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
    }`}
  >
    <span className="font-medium">{label}</span>
    <div className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-white/30' : 'bg-gray-300 dark:bg-gray-600'}`}>
       <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`}></div>
    </div>
  </button>
);

const TintButton: React.FC<{ color: BackgroundTint; active: boolean; onClick: () => void; label: string }> = ({ color, active, onClick, label }) => {
  let bgClass = '';
  switch(color) {
    case 'sepia': bgClass = 'bg-[#F5E6D3]'; break;
    case 'blue': bgClass = 'bg-[#E0F7FA]'; break;
    case 'black': bgClass = 'bg-black border border-gray-600'; break;
    default: bgClass = 'bg-[#2d2d2d] border border-gray-600';
  }

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 group">
      <div className={`w-8 h-8 rounded-full ${bgClass} shadow-sm transition-transform group-hover:scale-110 ${active ? 'ring-2 ring-accent ring-offset-2 ring-offset-white dark:ring-offset-gray-800' : ''}`}>
         {active && <Check size={16} className={`mx-auto mt-2 ${color === 'black' || color === 'default' ? 'text-white' : 'text-gray-900'}`} />}
      </div>
      <span className="text-[10px] text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">{label}</span>
    </button>
  );
};

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
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 mt-1">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase">Focus Timer</span>
        <span className="font-mono text-lg text-gray-900 dark:text-white font-bold tracking-wider">{formatTime(timeLeft)}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-bold text-white transition-colors ${isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {isActive ? <Pause size={12} /> : <Play size={12} />}
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={reset}
          className="px-3 py-1.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 rounded-md text-gray-800 dark:text-white transition-colors"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
};

export default AccessibilityToolbar;