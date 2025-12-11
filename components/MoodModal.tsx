import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { Mood } from '../types';

const MoodModal: React.FC = () => {
  const { showMoodModal, setShowMoodModal, setMood } = useSettings();
  const { setMicroChunking } = useAccessibility();

  if (!showMoodModal) return null;

  const handleSelect = (selectedMood: Mood) => {
    setMood(selectedMood);
    
    // Adaptive Logic: Auto-trigger tools based on mood
    // Fix: Match uppercase Mood type values
    if (selectedMood === 'STRESSED') {
      setMicroChunking(true);
    } else if (selectedMood === 'ENERGETIC') {
      setMicroChunking(false);
    }
    
    setShowMoodModal(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-panel border border-gray-700 p-8 rounded-3xl max-w-lg w-full shadow-2xl animate-slideUp text-center relative overflow-hidden">
        {/* Decorative Background Gradient */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-500 via-teal-500 to-cyan-500"></div>
        
        <h2 className="text-3xl font-bold text-text mb-3">Vibe Check</h2>
        <p className="text-text-muted mb-8 text-lg">How is your brain feeling right now?</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => handleSelect('STRESSED')}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gray-800/50 hover:bg-violet-900/30 hover:border-violet-500 border-2 border-transparent transition-all group active:scale-95"
          >
            <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <span className="text-4xl">😰</span>
            </div>
            <div>
              <span className="font-bold text-violet-400 block">Stressed</span>
              <span className="text-xs text-text-muted mt-1 block">Keep it simple & gentle.</span>
            </div>
          </button>

          <button 
            onClick={() => handleSelect('BALANCED')}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gray-800/50 hover:bg-teal-900/30 hover:border-teal-500 border-2 border-transparent transition-all group active:scale-95"
          >
            <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
               <span className="text-4xl">😐</span>
            </div>
             <div>
              <span className="font-bold text-teal-400 block">Focused</span>
              <span className="text-xs text-text-muted mt-1 block">Standard detailed mode.</span>
            </div>
          </button>

          <button 
            onClick={() => handleSelect('ENERGETIC')}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gray-800/50 hover:bg-cyan-900/30 hover:border-cyan-500 border-2 border-transparent transition-all group active:scale-95"
          >
             <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
               <span className="text-4xl">🤩</span>
             </div>
             <div>
              <span className="font-bold text-cyan-400 block">Energetic</span>
              <span className="text-xs text-text-muted mt-1 block">Challenge me! Deep dive.</span>
            </div>
          </button>
        </div>
        
        <p className="mt-8 text-xs text-text-muted opacity-60">
          This adapts the app's colors, accessibility tools, and AI personality.
        </p>
      </div>
    </div>
  );
};

export default MoodModal;