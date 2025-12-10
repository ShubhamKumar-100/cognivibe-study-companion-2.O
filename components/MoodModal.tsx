import React from 'react';
import { Smile, Frown, Zap } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { Mood } from '../types';

const MoodModal: React.FC = () => {
  const { showMoodModal, setShowMoodModal, setMood } = useSettings();

  if (!showMoodModal) return null;

  const handleSelect = (selectedMood: Mood) => {
    setMood(selectedMood);
    setShowMoodModal(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-panel border border-gray-700 p-8 rounded-3xl max-w-md w-full shadow-2xl animate-slideUp text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Vibe Check</h2>
        <p className="text-text-muted mb-8">How are you feeling right now? We'll adapt the AI to match.</p>

        <div className="grid grid-cols-3 gap-4">
          <button 
            onClick={() => handleSelect('stressed')}
            className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-gray-800 hover:bg-blue-900/30 hover:border-blue-500 border-2 border-transparent transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">😰</span>
            </div>
            <span className="font-medium text-blue-300">Stressed</span>
          </button>

          <button 
            onClick={() => handleSelect('okay')}
            className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-gray-800 hover:bg-teal-900/30 hover:border-teal-500 border-2 border-transparent transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
               <span className="text-2xl">😐</span>
            </div>
            <span className="font-medium text-teal-300">Okay</span>
          </button>

          <button 
            onClick={() => handleSelect('energetic')}
            className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-gray-800 hover:bg-orange-900/30 hover:border-orange-500 border-2 border-transparent transition-all group"
          >
             <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
               <span className="text-2xl">🤩</span>
             </div>
            <span className="font-medium text-orange-300">Energetic</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoodModal;