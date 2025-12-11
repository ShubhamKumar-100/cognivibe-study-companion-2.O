import React, { useState, useEffect, useRef } from 'react';
import { Volume2, BookOpen, X, Loader2, Sparkles } from 'lucide-react';

// Mock Definition function (Hackathon ke liye kaafi hai)
const mockDefine = async (text: string) => {
  return new Promise<string>((resolve) => {
    setTimeout(() => {
        const definitions: Record<string, string> = {
            "heric": "Highly Efficient and Reliable Inverter Concept - a type of circuit design.",
            "inverter": "A device that converts DC battery power into AC power for home appliances.",
            "leakage": "Energy that escapes from the circuit instead of being used efficiently.",
            "voltage": "The 'pressure' from an electrical circuit's power source that pushes charged electrons.",
            "current": "The rate at which electrons flow past a point in a complete electrical circuit."
        };
        const lowerText = text.toLowerCase();
        // Return matching definition or generic AI response
        resolve(definitions[lowerText] || `Contextual definition for '${text}': A key concept in this study module related to the physics of energy flow.`);
    }, 800);
  });
};

const WordWizard: React.FC = () => {
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [definition, setDefinition] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect Selection
    const handleSelection = () => {
      const selectionObj = window.getSelection();
      
      // Basic validation: Must be text, not empty, not too long
      if (!selectionObj || selectionObj.toString().trim().length === 0 || selectionObj.toString().length > 50) {
        return;
      }

      const text = selectionObj.toString().trim();
      
      // Get coordinates
      try {
        const range = selectionObj.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Show menu ONLY if we are inside the app container
        if (rect.width > 0 && rect.height > 0) {
            setSelection({
                text,
                x: rect.left + rect.width / 2,
                y: rect.top + window.scrollY - 12, // Position slightly above
            });
            setDefinition(null); // Reset old definition
        }
      } catch (e) {
          console.log("Selection error", e);
      }
    };

    // Close menu on click outside
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return; // Click inside menu, do nothing
      }
      // Click outside: Clear selection
      const sel = window.getSelection();
      if (sel) sel.removeAllRanges();
      setSelection(null);
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selection) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(selection.text);
      utterance.rate = 0.9; // Slightly slower for clarity
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleDefine = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selection) {
      setLoading(true);
      try {
        const result = await mockDefine(selection.text);
        setDefinition(result);
      } catch (e) {
        setDefinition("Could not define this word.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (!selection) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] animate-in fade-in zoom-in duration-200"
      style={{
        left: selection.x,
        top: selection.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="bg-gray-900 border border-teal-500/50 text-white rounded-xl shadow-[0_0_25px_rgba(20,184,166,0.6)] p-1.5 flex flex-col gap-2 min-w-[160px] relative">
        
        {!definition ? (
          <div className="flex items-center gap-1">
            <button
              onClick={handleSpeak}
              className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-sm font-bold text-teal-300"
            >
              <Volume2 size={16} /> Speak
            </button>
            <div className="w-px h-5 bg-gray-700" />
            <button
              onClick={handleDefine}
              className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-sm font-bold text-yellow-400"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
              Define
            </button>
          </div>
        ) : (
          <div className="px-4 py-3 max-w-xs bg-gray-800/90 rounded-lg backdrop-blur-md">
            <div className="flex justify-between items-start mb-2 border-b border-gray-700 pb-2">
              <div className="flex items-center gap-2">
                  <Sparkles size={12} className="text-yellow-400" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cogni-Define</span>
              </div>
              <button onClick={() => setSelection(null)}><X size={14} className="text-gray-500 hover:text-white" /></button>
            </div>
            <p className="text-sm leading-relaxed text-gray-100 font-medium">"{definition}"</p>
          </div>
        )}
        
        {/* Triangle Pointer */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-gray-900" />
      </div>
    </div>
  );
};

export default WordWizard;