
import React, { useState, useEffect, useRef } from 'react';
import { Swords, Mic, MicOff, Loader2, Send, Bot, User, Volume2, Sparkles, ShieldAlert } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const settings = useSettings();
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Initial challenge
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

    // Setup Speech
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        handleUserArgument(text);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }

    synthRef.current = window.speechSynthesis;

    startDebate();

    return () => {
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [topic]);

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthRef.current.getVoices();
    const voice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) || voices[0];
    if (voice) utterance.voice = voice;
    utterance.rate = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  };

  const handleUserArgument = async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const rebuttal = await getDebateResponse(text, topic, messages, settings.apiKey);
      setMessages(prev => [...prev, { role: 'ai', text: rebuttal }]);
      speakText(rebuttal);
    } catch (err) {
      setError("AI couldn't respond to that point.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (isSpeaking) synthRef.current?.cancel();
      recognitionRef.current?.start();
    }
  };

  return (
    <div className="flex flex-col h-full bg-panel">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-gray-700/50 flex items-center justify-between bg-panel/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/20 p-2 rounded-lg">
            <Swords className="text-orange-500 w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg md:text-xl text-white">Debate Dojo</h3>
            <p className="text-xs text-text-muted uppercase tracking-widest font-bold">Devil's Advocate Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full">
            <ShieldAlert size={14} className="text-red-500" />
            <span className="text-[10px] font-bold text-red-500 uppercase">Competitive Tuning</span>
        </div>
      </div>

      {/* Chat History */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar bg-black/5">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fadeIn`}>
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'ai' ? 'bg-orange-600' : 'bg-accent'}`}>
              {msg.role === 'ai' ? <Bot size={18} className="text-white" /> : <User size={18} className="text-white" />}
            </div>
            <div className={`max-w-[80%] md:max-w-[70%] p-4 rounded-2xl shadow-md ${msg.role === 'ai' ? 'bg-gray-800 text-gray-100 rounded-tl-none border border-gray-700' : 'bg-accent text-white rounded-tr-none'}`}>
              <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-orange-600/30 flex items-center justify-center shrink-0">
               <Bot size={18} className="text-orange-400" />
            </div>
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl rounded-tl-none">
               <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
            </div>
          </div>
        )}
        {error && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center font-medium">{error}</div>}
      </div>

      {/* Controls */}
      <div className="p-6 md:p-10 border-t border-gray-700/50 bg-panel flex flex-col items-center gap-4">
        <div className="relative">
          {isSpeaking && <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping scale-150" />}
          <button 
            onClick={toggleMic}
            className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl relative z-10 ${isListening ? 'bg-red-500 scale-110 shadow-red-500/40' : 'bg-orange-600 hover:bg-orange-700 active:scale-95 shadow-orange-600/30'}`}
          >
            {isListening ? <MicOff size={32} className="text-white mb-1" /> : <Mic size={32} className="text-white mb-1" />}
            <span className="text-[9px] font-bold text-white/80 uppercase tracking-tighter">{isListening ? 'Listening' : 'Hold to Argue'}</span>
          </button>
        </div>
        <p className="text-xs text-text-muted text-center max-w-xs italic">
           "Defend your logic! Use the mic to speak your argument. The AI will hunt for gaps in your reasoning."
        </p>
      </div>
    </div>
  );
};

export default DebateMode;
