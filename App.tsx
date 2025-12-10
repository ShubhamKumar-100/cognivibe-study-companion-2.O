import React, { useState, useEffect } from 'react';
import { Moon, Sun, Cpu, Settings, AlertTriangle } from 'lucide-react';
import UploadZone from './components/UploadZone';
import KnowledgeDisplay from './components/KnowledgeDisplay';
import AccessibilityToolbar from './components/AccessibilityToolbar';
import MoodModal from './components/MoodModal';
import SettingsDialog from './components/SettingsDialog';
import GlobalAudioPlayer from './components/GlobalAudioPlayer';
import { AnalysisResult } from './types';
import { analyzeImage } from './services/geminiService';
import { AccessibilityProvider, useAccessibility } from './contexts/AccessibilityContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { AudioProvider } from './contexts/AudioContext';

const MainApp: React.FC = () => {
  const [isDark, setIsDark] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { dyslexiaFont, readingRuler, zenMode } = useAccessibility();
  const { mood, language, interest, apiKey } = useSettings();
  const [rulerY, setRulerY] = useState(0);

  // Handle Theme Logic
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDark]);

  // Handle Mood Attribute for CSS Variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mood);
  }, [mood]);

  // Handle Dyslexia Font Global Class
  useEffect(() => {
    const body = document.body;
    if (dyslexiaFont) {
      body.classList.add('font-dyslexic');
    } else {
      body.classList.remove('font-dyslexic');
    }
  }, [dyslexiaFont]);

  // Handle Reading Ruler Mouse Tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setRulerY(e.clientY);
    };
    if (readingRuler) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [readingRuler]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleAnalyze = async (file: File) => {
    setErrorMessage(null);

    if (!apiKey) {
      setErrorMessage("Please enter your Gemini API Key in Settings to continue.");
      setIsSettingsOpen(true);
      return;
    }

    setIsProcessing(true);
    setAnalysisData(null); 
    
    try {
      const result = await analyzeImage(file, { mood, language, interest }, apiKey);
      setAnalysisData(result);
    } catch (error: any) {
      console.error("Analysis failed", error);
      setErrorMessage(error.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`flex flex-col h-screen transition-colors duration-500 bg-background ${zenMode ? 'zen-mode' : ''}`}>
      
      {/* Modals */}
      <MoodModal />
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Reading Ruler Overlay */}
      {readingRuler && (
        <div 
          className="reading-ruler" 
          style={{ top: `${rulerY}px` }} 
        />
      )}

      {/* Header */}
      <header className={`flex-none h-16 border-b border-gray-700/50 bg-panel flex items-center justify-between px-6 z-20 shadow-md transition-opacity duration-500 ${zenMode ? 'zen-dimed hover:opacity-100' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="bg-accent/10 p-2 rounded-lg">
            <Cpu className="text-accent w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Cogni<span className="text-accent">Vibe</span></span>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-700 transition-colors text-text-muted hover:text-white text-sm font-medium"
            title="Settings"
          >
            <Settings size={18} />
            <span className="hidden md:inline">Settings</span>
          </button>
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors text-text-muted hover:text-white"
            title="Toggle Theme"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="bg-red-500/10 border-b border-red-500/50 p-4 flex items-center justify-between animate-slideUp z-30">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle size={20} />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="text-red-400 hover:text-red-300 font-bold px-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Split */}
      <div className={`flex-1 flex flex-col md:flex-row overflow-hidden transition-opacity duration-500 ${zenMode ? 'zen-dimed hover:opacity-100' : ''}`}>
        {/* Left Panel: Upload */}
        <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-gray-700/50 bg-background relative z-10">
           <UploadZone onAnalyze={handleAnalyze} isProcessing={isProcessing} />
        </div>

        {/* Right Panel: Knowledge Display */}
        <div className="w-full md:w-1/2 h-full overflow-hidden bg-panel relative z-0">
          <KnowledgeDisplay data={analysisData} isProcessing={isProcessing} />
        </div>
      </div>

      {/* Floating Accessibility Toolbar */}
      <AccessibilityToolbar />

      {/* Global Audio Player */}
      <GlobalAudioPlayer />
    </div>
  );
};

const App: React.FC = () => (
  <SettingsProvider>
    <AudioProvider>
      <AccessibilityProvider>
        <MainApp />
      </AccessibilityProvider>
    </AudioProvider>
  </SettingsProvider>
);

export default App;