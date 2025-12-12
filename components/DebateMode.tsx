
import React, { useState, useEffect, useRef } from 'react';
import { 
  Swords, Mic, MicOff, Loader2, Bot, User, Volume2, 
  Sparkles, ShieldAlert, Play, Pause, Square, Power,
  XCircle
} from 'lucide-react';
import { getDebateResponse } from '../services/geminiService';
import { useSettings } from '../contexts/SettingsContext';

interface Message {
  role: 'ai' | 'user';
  text: string;
}

const DebateMode: React.FC<{ topic: string }> = ({ topic }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [wasListeningBeforePause, setWasListeningBeforePause] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const settings = useSettings();
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Initial Setup
  useEffect(() => {
    // 1. Initialize Speech Synth
    synthRef.current = window.speechSynthesis;

    // 2. Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
      };
      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        handleUserArgument(text);
      };
      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setError(`Mic error: ${event.error}`);
        }
      };
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setError("Speech recognition is not supported in this browser.");
    }

    // 3. Start Debate (Initial Challenge)
    const startDebate = async () => {
      setLoading(true);
      try {
        const challenge = `I don't think "${topic}" is as efficient or important as people say. Convince me otherwise. What's your strongest argument?`;
        setMessages([{ role: 'ai', text: challenge }]);
        speakText(challenge);
      } catch (err) {
        setError("Failed to start debate.");
      } finally {
        setLoading(false);
      }
    };

    startDebate();

    // Cleanup
    return () => {
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [topic]);

  // TTS Execution logic
  const speakText = (text: string) => {
    if (!synthRef.current) return;
    
    // Stop any existing speech before starting new one
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthRef.current.getVoices();
    // Prefer Google or high-quality voices for better persona
    const voice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) || voices[0];
    
    if (voice) utterance.voice = voice;
    utterance.rate = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  // Logic to process user voice input
  const handleUserArgument = async (text: string) => {
    if (isPaused) return;
    
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      // Fix: Removed unnecessary 4th argument settings.apiKey to match getDebateResponse's signature (3 parameters)
      const rebuttal = await getDebateResponse(text, topic, messages);
      setMessages(prev => [...prev, { role: 'ai', text: rebuttal }]);
      
      // Only speak if not paused during the network call
      if (!isPaused) {
        speakText(rebuttal);
      }
    } catch (err) {
      setError("I'm finding it hard to process that logical gap. Try again?");
    } finally {
      setLoading(false);
    }
  };

  // Play / Pause Logic
  const togglePause = () => {
    if (!isPaused) {
      // Logic to PAUSE
      setIsPaused(true);
      
      // Pause TTS
      if (synthRef.current?.speaking) {
        synthRef.current.pause();
      }
      
      // Stop Mic if active
      if (isListening) {
        setWasListeningBeforePause(true);
        recognitionRef.current?.stop();
      } else {
        setWasListeningBeforePause(false);
      }
    } else {
      // Logic to RESUME
      setIsPaused(false);
      
      // Resume TTS if it was paused
      if (synthRef.current?.paused) {
        synthRef.current.resume();
      }
      
      // Resume Mic if it was active
      if (wasListeningBeforePause) {
        recognitionRef.current?.start();
        setWasListeningBeforePause(false);
      }
    }
  };

  // Reset Logic
  const resetDebate = () => {
    if (synthRef.current) synthRef.current.cancel();
    if (recognitionRef.current) recognitionRef.current.abort();
    setMessages([]);
    setIsPaused(false);
    setWasListeningBeforePause(false);
    setIsListening(false);
    setIsSpeaking(false);
    setLoading(false);
    
    // Restart initial challenge
    const restart = async () => {
      setLoading(true);
      const challenge = `Let's start over. Tell me again, why should I care about "${topic}"? I'm still skeptical.`;
      setMessages([{ role: 'ai', text: challenge }]);
      speakText(challenge);
      setLoading(false);
    };
    restart();
  };

  const toggleMic = () => {
    if (isPaused) return; // Disallow interaction when paused
    
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      // If AI is currently speaking, stop it before listening
      if (isSpeaking) {
        synthRef.current?.cancel();
        setIsSpeaking(false);
      }
      recognitionRef.current?.start();
    }
  };

  return (
    <div className="flex flex-col h-full bg-panel relative overflow-hidden">
      {/* Paused Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fadeIn">
          <div className="bg-panel/80 p-8 rounded-3xl border border-orange-500/30 shadow-2xl text-center space-y-4 max-w-xs mx-auto">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Pause size={32} className="text-orange-500" />
            </div>
            <h2 className="text-xl font-bold text-white">Debate Paused</h2>
            <p className="text-sm text-text-muted">Logical gaps are waiting for your defense. Tap Play to continue the Dojo session.</p>
            <button 
              onClick={togglePause}
              className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <Play size={18} fill="currentColor" /> Resume Session
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 md:p-6 border-b border-gray-700/50 flex items-center justify-between bg-panel/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/20 p-2 rounded-lg">
            <Swords className="text-orange-500 w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg md:text-xl text-white">Debate Dojo</h3>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-black flex items-center gap-1">
              <Sparkles size={10} className="text-orange-400" /> Devil's Advocate Mode
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full">
              <ShieldAlert size={14} className="text-red-500" />
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Competitive Tuning</span>
          </div>
          <button 
            onClick={resetDebate}
            className="p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-all"
            title="Reset Debate"
          >
            <Square size={20} />
          </button>
        </div>
      </div>

      {/* Chat History */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar bg-black/5 relative">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full opacity-30 italic text-center p-8">
            <Swords size={48} className="mb-4 text-orange-500" />
            <p>Waiting to challenge your knowledge...</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fadeIn`}>
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'ai' ? 'bg-orange-600' : 'bg-accent'}`}>
              {msg.role === 'ai' ? <Bot size={18} className="text-white" /> : <User size={18} className="text-white" />}
            </div>
            <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl shadow-sm ${msg.role === 'ai' ? 'bg-panel border border-gray-700/50 text-gray-100 rounded-tl-none' : 'bg-accent text-white rounded-tr-none'}`}>
              <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-orange-600/30 flex items-center justify-center shrink-0">
               <Bot size={18} className="text-orange-400" />
            </div>
            <div className="bg-panel border border-gray-700/50 p-4 rounded-2xl rounded-tl-none">
               <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center font-bold flex items-center justify-center gap-2">
            <XCircle size={16} /> {error}
          </div>
        )}
      </div>

      {/* Unified Media Control Bar */}
      <div className="p-4 md:p-6 border-t border-gray-700/50 bg-panel shrink-0 z-20">
        <div className="max-w-md mx-auto flex flex-col items-center gap-6">
          
          {/* Main Controls Row */}
          <div className="flex items-center justify-center gap-10">
            {/* End Debate Button */}
            <button 
              onClick={resetDebate}
              className="p-3 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all active:scale-95"
              title="Stop / Reset Debate"
            >
              <Square size={24} fill="currentColor" />
            </button>

            {/* Mic Center Piece */}
            <div className="relative">
              {!isPaused && (isListening || isSpeaking) && (
                <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping scale-150" />
              )}
              <button 
                onClick={toggleMic}
                disabled={isPaused}
                className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl relative z-10 border-4 border-white/10 ${
                  isPaused 
                  ? 'bg-gray-700 grayscale opacity-50 cursor-not-allowed' 
                  : isListening 
                    ? 'bg-red-500 scale-110 shadow-red-500/40 animate-pulse' 
                    : 'bg-orange-600 hover:bg-orange-700 active:scale-95 shadow-orange-600/30'
                }`}
              >
                {isListening ? <MicOff size={32} className="text-white mb-1" /> : <Mic size={32} className="text-white mb-1" />}
                <span className="text-[9px] font-black text-white/80 uppercase tracking-tighter">
                  {isListening ? 'Listening' : 'Tap to Argue'}
                </span>
              </button>
            </div>

            {/* Play/Pause Button */}
            <button 
              onClick={togglePause}
              className={`p-3 rounded-full transition-all active:scale-95 ${
                isPaused 
                ? 'bg-accent text-white shadow-lg' 
                : 'text-text-muted hover:text-accent hover:bg-accent/10'
              }`}
              title={isPaused ? "Resume Session" : "Pause Session"}
            >
              {isPaused ? <Play size={28} fill="currentColor" /> : <Pause size={28} fill="currentColor" />}
            </button>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">
               <Volume2 size={12} className={isSpeaking ? 'text-orange-400 animate-pulse' : ''} />
               <span>Live Logic Processing</span>
            </div>
            <p className="text-[10px] md:text-xs text-text-muted text-center max-w-xs italic opacity-70">
              "Logic gaps hunt is active. Defend your topic using deep reasoning."
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DebateMode;
