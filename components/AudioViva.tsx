
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, X, Loader2, MessageCircle, Sparkles } from 'lucide-react';
import { getVivaResponse } from '../services/geminiService';
import { useSettings } from '../contexts/SettingsContext';

export default function AudioViva() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mood, interest } = useSettings();
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Stop after one sentence
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        // Automatically stop listening and process
        setIsListening(false); 
        processUserVoice(text);
      };

      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
        
        // Handle 'no-speech' gracefully
        if (event.error === 'no-speech') {
          console.warn("No speech detected. Please speak louder or closer to the mic.");
          return; 
        }

        console.error("Speech Recognition Error:", event.error);
        
        if (event.error === 'not-allowed') {
          setError("Microphone access denied. Check browser permissions.");
        } else {
          setError("Could not hear you. Please try again.");
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setError("Speech recognition is not supported in this browser. Try Chrome.");
    }

    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
         try { recognitionRef.current.abort(); } catch(e) {}
      }
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      // User manually stops
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        setIsListening(false);
      }
    } else {
      // User starts listening
      if (synthRef.current?.speaking) synthRef.current.cancel(); 
      
      setTranscript('');
      setResponse('');
      setError(null);
      
      // Small delay to prevent instant cut-off on click
      setTimeout(() => {
        try {
          recognitionRef.current?.start();
        } catch (e) {
          console.warn("Failed to start speech recognition:", e);
          setIsListening(false);
        }
      }, 100);
    }
  };

  const processUserVoice = async (query: string) => {
    if (!query) return;
    setLoading(true);
    try {
      const context = interest !== 'None' ? interest : "General Education";
      const aiResponse = await getVivaResponse(query, context, mood);
      setResponse(aiResponse);
      speakResponse(aiResponse);
    } catch (err) {
      setError("AI check failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const speakResponse = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel(); // Stop any current speech
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthRef.current.getVoices();
    
    // Strictly use US English voices
    const preferredVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) || voices.find(v => v.lang === 'en-US');
    
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.0; 
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-50 border-2 border-white/20"
        title="Voice Viva Mode"
      >
        <MessageCircle size={28} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 w-80 bg-panel border border-purple-500/30 rounded-2xl shadow-2xl p-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden">
      {/* Background Glow */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl transition-all duration-500 ${isListening || isSpeaking ? 'opacity-100 scale-150' : 'opacity-0 scale-100'}`} />
      
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h3 className="font-bold text-purple-400 flex items-center gap-2">
          <Sparkles size={16} /> Audio Viva
        </h3>
        <button onClick={() => { setIsOpen(false); synthRef.current?.cancel(); }} className="text-gray-500 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="min-h-[100px] flex flex-col justify-center">
          {transcript && (
            <div className="mb-3 animate-fadeIn">
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest block mb-1">You asked</span>
              <p className="text-sm text-gray-300 italic">"{transcript}"</p>
            </div>
          )}
          
          {loading ? (
            <div className="flex items-center gap-2 text-purple-400 animate-pulse">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs font-medium">Thinking...</span>
            </div>
          ) : response ? (
            <div className="animate-slideUp">
              <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest block mb-1">AI Tutor</span>
              <p className="text-sm text-white leading-relaxed">{response}</p>
            </div>
          ) : !error ? (
            <p className="text-xs text-text-muted text-center italic">
              "Tap the mic and ask me anything!"
            </p>
          ) : null}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={toggleListening}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isListening 
              ? 'bg-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]' 
              : 'bg-purple-600 hover:bg-purple-700 shadow-lg'
            }`}
          >
            {isListening ? <MicOff size={28} className="text-white" /> : <Mic size={28} className="text-white" />}
          </button>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${isListening ? 'text-red-400' : 'text-text-muted'}`}>
            {isListening ? 'Listening...' : 'Tap to Speak'}
          </span>
        </div>
      </div>
    </div>
  );
}
