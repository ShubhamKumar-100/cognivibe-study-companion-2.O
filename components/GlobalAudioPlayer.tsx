import React from 'react';
import { Play, Pause, X, FastForward, Volume2 } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';

const GlobalAudioPlayer: React.FC = () => {
  const { isPlaying, text, togglePlay, stop, speed, setSpeed, hasAudio } = useAudio();

  if (!hasAudio) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-panel border-t border-gray-700/50 flex items-center px-4 md:px-8 justify-between z-40 shadow-[0_-5px_15px_rgba(0,0,0,0.3)] animate-slideUp">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent animate-pulse-glow">
          <Volume2 size={20} />
        </div>
        <div className="hidden md:block">
          <span className="text-xs font-bold text-accent uppercase tracking-wider">Now Playing</span>
          <p className="text-sm text-white font-medium max-w-xs truncate">Story Mode Narration</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
          <button 
            onClick={() => setSpeed(Math.max(0.5, speed - 0.25))}
            className="text-text-muted hover:text-white px-2 text-xs font-mono"
          >
            -
          </button>
          <span className="text-xs font-mono w-8 text-center text-white">{speed}x</span>
          <button 
            onClick={() => setSpeed(Math.min(2, speed + 0.25))}
            className="text-text-muted hover:text-white px-2 text-xs font-mono"
          >
            +
          </button>
        </div>

        <button 
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-hover transition-transform active:scale-95 shadow-lg"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
        </button>

        <button 
          onClick={stop}
          className="p-2 text-text-muted hover:text-red-400 transition-colors"
          title="Close Player"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default GlobalAudioPlayer;