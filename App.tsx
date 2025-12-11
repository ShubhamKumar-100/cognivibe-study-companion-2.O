
import React, { useState, useEffect } from 'react';
import { 
  Moon, Sun, Cpu, Settings, AlertTriangle, Zap, Smile, Frown, X, 
  Headphones, CloudRain, VolumeX, Volume2, FileText 
} from 'lucide-react';

import UploadZone from './components/UploadZone';
import KnowledgeDisplay from './components/KnowledgeDisplay';
import AccessibilityToolbar from './components/AccessibilityToolbar';
import MoodModal from './components/MoodModal';
import SettingsDialog from './components/SettingsDialog';
import WordWizard from './components/WordWizard';
import ReportModal from './components/ReportModal';
import AudioViva from './components/AudioViva';
import ChatAssistant from './components/ChatAssistant';

import { AnalysisResult } from './types';
import { analyzeImage } from './services/geminiService';

import { AccessibilityProvider, useAccessibility } from './contexts/AccessibilityContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { AudioProvider, useAudio } from './contexts/AudioContext';
import { ProgressProvider, useProgress } from './contexts/ProgressContext';

// AppHeader component for navigation and utility buttons
const AppHeader = ({ 
  isDark, 
  toggleTheme, 
  setIsSettingsOpen, 
  setIsReportOpen, 
  getVibeBadge, 
  settings, 
  zenMode 
}: any) => {
  const { focusMode, setFocusMode, volume, setVolume } = useAudio();
  const [showSoundMenu, setShowSoundMenu] = useState(false);

  return (
    <header className={`flex-none h-16 border-b border-gray-700/50 bg-panel flex items-center justify-between px-6 z-20 shadow-md transition-all duration-500 ${zenMode ? 'opacity-10 blur-sm pointer-events-none' : 'opacity-100'}`}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-accent/10 p-2 rounded-lg">
            <Cpu className="text-accent w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight hidden md:inline">
            Cogni<span className="text-accent">Vibe</span>
          </span>
        </div>
        <button onClick={() => settings.setShowMoodModal(true)} className="hover:scale-105 transition-transform" title="Change Vibe">
           {getVibeBadge()}
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <button 
            onClick={() => setShowSoundMenu(!showSoundMenu)}
            className={`p-2 rounded-full transition-all ${focusMode !== 'OFF' ? 'text-teal-400 bg-teal-400/10 animate-pulse' : 'text-text-muted hover:text-text'}`}
            title="Focus Sounds"
          >
            <Headphones size={20} />
          </button>
          {showSoundMenu && (
            <div className="absolute right-0 top-12 w-64 bg-panel border border-white/10 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-3">
                 <h3 className="text-text-muted text-xs font-bold uppercase tracking-wider">Focus Soundscapes</h3>
                 <button onClick={() => setShowSoundMenu(false)}><X size={14} className="text-gray-500" /></button>
              </div>
              <div className="space-y-2">
                <button onClick={() => setFocusMode('BROWN')} className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${focusMode === 'BROWN' ? 'bg-teal-500/20 border-teal-500 text-teal-300' : 'border-transparent hover:bg-white/5 text-text-muted'}`}>
                  <Zap size={18} /> <span className="text-sm font-medium">Brown Noise (ADHD)</span>
                </button>
                <button onClick={() => setFocusMode('RAIN')} className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${focusMode === 'RAIN' ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'border-transparent hover:bg-white/5 text-text-muted'}`}>
                  <CloudRain size={18} /> <span className="text-sm font-medium">Rain Ambience</span>
                </button>
                <button onClick={() => setFocusMode('OFF')} className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${focusMode === 'OFF' ? 'bg-red-500/10 border-red-500/50 text-red-300' : 'border-transparent hover:bg-white/5 text-text-muted'}`}>
                  <VolumeX size={18} /> <span className="text-sm font-medium">Turn Off</span>
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 size={14} className="text-text-muted" />
                  <span className="text-xs text-text-muted">Volume</span>
                </div>
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-teal-500" />
              </div>
            </div>
          )}
        </div>
        <button 
          onClick={() => setIsReportOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-600/30 hover:bg-gray-700/50 transition-colors text-text-muted hover:text-text text-sm font-medium group"
          title="Generate Parent Report"
        >
          <FileText size={16} className="group-hover:text-indigo-400 transition-colors" />
          <span className="hidden md:inline">Report</span>
        </button>
        <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-gray-700/50 transition-colors text-text-muted hover:text-text">
          Settings
        </button>
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-700/50 transition-colors text-text-muted hover:text-text">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
};

// Main application logic and layout
const MainApp: React.FC = () => {
  const [isDark, setIsDark] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false); 
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rulerY, setRulerY] = useState(0);

  const { dyslexiaFont, readingRuler, zenMode, setZenMode } = useAccessibility();
  const settings = useSettings(); 
  const progress = useProgress();
  const { mood, useMockMode } = settings; 

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) { html.classList.add('dark'); } else { html.classList.remove('dark'); }
  }, [isDark]);

  useEffect(() => { document.documentElement.setAttribute('data-theme', mood.toLowerCase()); }, [mood]);

  useEffect(() => {
    const body = document.body;
    if (dyslexiaFont) { body.classList.add('font-dyslexic'); } else { body.classList.remove('font-dyslexic'); }
  }, [dyslexiaFont]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { setRulerY(e.clientY); };
    if (readingRuler) { window.addEventListener('mousemove', handleMouseMove); }
    return () => { window.removeEventListener('mousemove', handleMouseMove); };
  }, [readingRuler]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleAnalyze = async (file: File) => {
    setErrorMessage(null);
    setIsProcessing(true);
    setAnalysisData(null); 
    try {
      const result = await analyzeImage(file, settings);
      setAnalysisData(result);
    } catch (error: any) {
      console.error("Analysis failed", error);
      setErrorMessage(error.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getVibeBadge = () => {
    switch (mood) {
      case 'STRESSED': return (<div className="flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 text-violet-400 rounded-full border border-violet-500/30 text-xs font-bold animate-fadeIn"><Frown size={14} /><span>Gentle Vibe</span></div>);
      case 'ENERGETIC': return (<div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30 text-xs font-bold animate-fadeIn"><Zap size={14} /><span>Turbo Mode</span></div>);
      default: return (<div className="flex items-center gap-1.5 px-3 py-1 bg-teal-500/20 text-teal-400 rounded-full border border-teal-500/30 text-xs font-bold animate-fadeIn"><Smile size={14} /><span>Balanced</span></div>);
    }
  };

  return (
    <div className="flex flex-col min-h-screen md:h-screen transition-colors duration-500 bg-background text-text overflow-y-auto md:overflow-hidden">
      <MoodModal />
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <WordWizard />
      <AudioViva />
      <ChatAssistant />
      
      <ReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        topic={progress.topic}
        score={progress.score}
        totalQuestions={progress.totalQuestions}
        weakestCategory={progress.weakestCategory}
      />

      {readingRuler && (<div className="reading-ruler z-[60]" style={{ top: `${rulerY}px` }} />)}

      {zenMode && (
        <div className="fixed inset-0 bg-black/95 z-40 transition-opacity duration-500 flex items-center justify-center pointer-events-auto animate-fadeIn">
           <button 
            onClick={() => setZenMode(false)} 
            className="fixed bottom-10 left-10 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full border border-white/30 backdrop-blur-md transition-all z-50 flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 font-bold tracking-widest"
          >
            EXIT ZEN MODE <X size={18} />
          </button>
        </div>
      )}

      <AppHeader 
        isDark={isDark} 
        toggleTheme={toggleTheme} 
        setIsSettingsOpen={setIsSettingsOpen} 
        setIsReportOpen={setIsReportOpen}
        getVibeBadge={getVibeBadge} 
        settings={settings} 
        zenMode={zenMode} 
      />

      {errorMessage && (
        <div className="bg-red-500/20 border-b border-red-500 p-4 flex items-center justify-between animate-slideUp z-30 relative shadow-lg">
          <div className="flex items-center gap-3 text-red-500">
            <AlertTriangle size={24} className="shrink-0" />
            <div>
              <span className="font-bold block">Action Required</span>
              <span className="text-sm opacity-90">{errorMessage}</span>
            </div>
          </div>
          <button onClick={() => setErrorMessage(null)} className="bg-red-500 text-white px-4 py-1 rounded-lg font-bold hover:bg-red-600 transition-colors">Dismiss</button>
        </div>
      )}

      {useMockMode && !zenMode && (
        <div className="fixed bottom-24 right-6 z-50 bg-accent/20 border border-accent/50 text-accent px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md pointer-events-none">
          MOCK MODE ACTIVE
        </div>
      )}

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden transition-all duration-500">
        <div className={`w-full md:w-[400px] border-r border-gray-700/50 bg-panel overflow-y-auto shrink-0 transition-all duration-500 ${zenMode ? 'opacity-10 blur-sm pointer-events-none' : 'opacity-100'}`}>
          <UploadZone onAnalyze={handleAnalyze} isProcessing={isProcessing} />
        </div>
        <div className={`flex-1 flex flex-col overflow-hidden relative transition-all duration-500 ${zenMode ? 'z-50' : 'z-10'}`}>
          <KnowledgeDisplay data={analysisData} isProcessing={isProcessing} />
          <AccessibilityToolbar />
        </div>
      </main>
    </div>
  );
};

// Main App wrapper component with context providers
const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AccessibilityProvider>
        <AudioProvider>
          <ProgressProvider>
            <MainApp />
          </ProgressProvider>
        </AudioProvider>
      </AccessibilityProvider>
    </SettingsProvider>
  );
};

export default App;
