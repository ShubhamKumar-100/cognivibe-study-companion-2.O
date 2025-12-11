
import React from 'react';
import { X, Languages, Sparkles, TestTube, Key } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { Language, Interest } from '../types';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const LANGUAGES: Language[] = ['English', 'Hindi', 'French', 'Spanish'];
const INTERESTS: Interest[] = ['None', 'Minecraft', 'Marvel', 'Space', 'Cricket', 'Anime'];

const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const { 
    language, setLanguage, 
    interest, setInterest, 
    useMockMode, setUseMockMode,
    apiKey, setApiKey
  } = useSettings();

  const handleSave = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 w-full max-w-sm rounded-2xl shadow-2xl p-6 relative animate-slideUp max-h-[90vh] overflow-y-auto text-gray-900 dark:text-gray-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-6">Settings</h2>

        <div className="space-y-6">
          {/* API Key Input */}
          <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
              <Key size={16} className="text-accent" /> Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API Key..."
              className="w-full bg-white dark:bg-[#0f0f0f] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-accent outline-none"
            />
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">
              Saved locally. Used for all AI calls.
            </p>
          </div>

          {/* Mock Mode Toggle */}
          <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200">
                <TestTube size={16} className="text-accent" /> Mock Mode (Demo)
              </label>
              <button 
                onClick={() => setUseMockMode(!useMockMode)}
                className={`w-12 h-6 rounded-full transition-colors relative ${useMockMode ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${useMockMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Use simulated data instead of calling Gemini API.
            </p>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Language Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-300 mb-3">
              <Languages size={16} /> Output Language
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    language === lang 
                      ? 'bg-accent border-accent text-white shadow-md' 
                      : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Interest Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-300 mb-3">
              <Sparkles size={16} /> Analogy Interest
            </label>
            <div className="relative">
              <select
                value={interest}
                onChange={(e) => setInterest(e.target.value as Interest)}
                className="w-full bg-white dark:bg-[#0f0f0f] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none appearance-none"
              >
                {INTERESTS.map((int) => (
                  <option key={int} value={int}>{int === 'None' ? 'No Preference' : int}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Gemini will explain concepts using metaphors from your selected interest.
            </p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full mt-8 bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-xl transition-colors shadow-lg"
        >
          Save & Close
        </button>
      </div>
    </div>
  );
};

export default SettingsDialog;
