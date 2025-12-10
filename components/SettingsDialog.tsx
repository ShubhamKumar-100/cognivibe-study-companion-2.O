import React, { useState, useEffect } from 'react';
import { X, Languages, Sparkles, Key } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { Language, Interest } from '../types';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const LANGUAGES: Language[] = ['English', 'Hindi', 'French', 'Spanish'];
const INTERESTS: Interest[] = ['None', 'Minecraft', 'Marvel', 'Space', 'Cricket', 'Anime'];

const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, interest, setInterest, apiKey, setApiKey } = useSettings();
  const [localKey, setLocalKey] = useState(apiKey);

  // Sync local state when context changes (or dialog opens)
  useEffect(() => {
    setLocalKey(apiKey);
  }, [apiKey, isOpen]);

  const handleSave = () => {
    setApiKey(localKey);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-panel border border-gray-700 w-full max-w-sm rounded-2xl shadow-2xl p-6 relative animate-slideUp">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-white mb-6">Settings</h2>

        <div className="space-y-6">
          {/* API Key Input */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-3">
              <Key size={16} /> Gemini API Key
            </label>
            <input 
              type="password"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="Enter your Gemini API Key"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none font-mono text-sm"
            />
            <p className="text-xs text-text-muted mt-2">
              Your key is saved locally in your browser.
            </p>
          </div>

          <hr className="border-gray-700" />

          {/* Language Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-3">
              <Languages size={16} /> Output Language
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    language === lang 
                      ? 'bg-accent text-white shadow-lg' 
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Interest Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-3">
              <Sparkles size={16} /> Analogy Interest
            </label>
            <select
              value={interest}
              onChange={(e) => setInterest(e.target.value as Interest)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none appearance-none"
            >
              {INTERESTS.map((int) => (
                <option key={int} value={int}>{int === 'None' ? 'No Preference' : int}</option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-2">
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