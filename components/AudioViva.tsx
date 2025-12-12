// components/AudioViva.tsx
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

  const settings = useSettings();
  const { mood, interest } = settings;
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => { setIsListening(true); setError(null); };
      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsListening(false); 
        processUserVoice(text);
      };
      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setError(`Mic error: ${event.error}`);
        }
      };
      recognitionRef.current.onend = () => { setIsListening(false); };
    }
    synthRef.current = window.speechSynthesis;
    return () => {
      if (recognitionRef.current) try { recognitionRef.current.abort(); } catch(e) {}
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  const toggleListening = () => {
    if (isListening) recognitionRef.current?.stop();
    else {
      synthRef.current?.cancel();
      setTranscript(''); setResponse(''); setError(null);
      recognitionRef.current?.start();
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
    } catch (err) { setError("AI Check failed."); }
    finally { setLoading(false); }
  };

  const speakResponse = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="fixed bottom-24 right-6 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-[100] border-2 border-white/20">
        <MessageCircle size={28} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 w-80 bg-panel border border-purple-500/30 rounded-2xl shadow-2xl p-6 z-[100] animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-purple-400 flex items-center gap-2"><Sparkles size={16} /> Audio Viva</h3>
        <button onClick={() => { setIsOpen(false); synthRef.current?.cancel(); }} className="text-gray-500 hover:text-white"><X size={20} /></button>
      </div>
      <div className="space-y-4">
        <div className="min-h-[100px] flex flex-col justify-center">
          {transcript && <p className="text-xs text-purple-300 italic mb-2">"{transcript}"</p>}
          {loading ? <Loader2 size={20} className="animate-spin text-purple-400 mx-auto" /> : <p className="text-sm text-white leading-relaxed">{response || "Ask me anything!"}</p>}
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>
        <button onClick={toggleListening} className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-purple-600 hover:bg-purple-700'}`}>
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          {isListening ? 'Stop' : 'Ask Viva'}
        </button>
      </div>
    </div>
  );
}