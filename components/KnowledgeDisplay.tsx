import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BookOpen, HelpCircle, Network, Zap, Volume2, RotateCw, StickyNote, 
  CheckCircle, XCircle, Info, Play, Pause, Square, PenTool, Award, 
  ArrowRight, RotateCcw, Highlighter, Shield, FileText, AlertTriangle, 
  Target, Lock, Unlock, Loader2, Sparkles, Brain, Swords, ChevronRight, 
  MessageSquareDashed, Headphones
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AnalysisResult, TabType, QuizQuestion, MindMapNode, ExamPredictions, Flashcard } from '../types';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useAudio } from '../contexts/AudioContext';
import { useSettings } from '../contexts/SettingsContext';
import { useProgress } from '../contexts/ProgressContext';
import { generateHint, expandMindMapNode, getAdvancedQuiz } from '../services/geminiService'; 
import DebateMode from './DebateMode';

interface KnowledgeDisplayProps {
  data: AnalysisResult | null;
  isProcessing: boolean;
}

/**
 * Universal Theme Helper for Visual Comfort
 */
const getThemeStyles = (bgTint: string) => {
  switch (bgTint) {
    case 'sepia':
      return {
        container: 'bg-[#F5E6D3] text-gray-900',
        card: 'bg-white/40 border-orange-200/50 backdrop-blur-sm',
        text: 'text-gray-900',
        textMuted: 'text-gray-700',
        border: 'border-orange-300/30',
        icon: 'text-orange-700',
        innerMuted: 'bg-orange-100/50',
        contrastText: 'text-gray-900'
      };
    case 'blue':
      return {
        container: 'bg-[#E0F7FA] text-gray-900',
        card: 'bg-white/40 border-blue-200/50 backdrop-blur-sm',
        text: 'text-gray-900',
        textMuted: 'text-gray-700',
        border: 'border-blue-300/30',
        icon: 'text-blue-700',
        innerMuted: 'bg-blue-100/50',
        contrastText: 'text-gray-900'
      };
    case 'black':
      return {
        container: 'bg-black text-gray-100',
        card: 'bg-gray-900/50 border-gray-800',
        text: 'text-gray-100',
        textMuted: 'text-gray-400',
        border: 'border-gray-800',
        icon: 'text-accent',
        innerMuted: 'bg-white/5',
        contrastText: 'text-gray-100'
      };
    default:
      return {
        container: 'bg-panel text-text',
        card: 'bg-gray-800/20 border-gray-700/50',
        text: 'text-text',
        textMuted: 'text-text-muted',
        border: 'border-gray-700/50',
        icon: 'text-accent',
        innerMuted: 'bg-black/20',
        contrastText: 'text-gray-100'
      };
  }
};

/**
 * Robust Accessibility Text Transformer (Universal Helper)
 */
const applyAccessibilityTransforms = (text: any, settings: { bionic: boolean; chunking: boolean; syllables: boolean }) => {
    const { bionic, chunking, syllables } = settings;
    const safeText = String(text || '');

    const transformWord = (word: string) => {
        let processed = word;
        if (syllables && word.length > 3) {
            processed = processed.replace(/([aeiouy]{1,2}[^aeiouy]{0,2})/gi, '$1·').replace(/·$/, '');
        }
        if (bionic) {
            const splitIndex = Math.ceil(processed.length / 2);
            const boldPart = processed.slice(0, splitIndex);
            const restPart = processed.slice(splitIndex);
            return <React.Fragment key={word + Math.random()}><b className="font-bold">{boldPart}</b>{restPart}</React.Fragment>;
        }
        return processed;
    };

    const processSentence = (sentence: string) => {
        const words = sentence.split(/(\s+)/);
        return words.map((part, i) => {
            if (/\s+/.test(part)) return part;
            return <React.Fragment key={i}>{transformWord(part)}</React.Fragment>;
        });
    };

    if (chunking) {
        const sentences = safeText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
        return (
            <ul className="space-y-3 my-4">
                {sentences.map((sent, i) => (
                    <li key={i} className="flex gap-3 items-start group">
                        <span className="text-accent mt-1.5 shrink-0 transition-transform group-hover:scale-125">•</span>
                        <span className="leading-relaxed text-balance">{processSentence(sent)}</span>
                    </li>
                ))}
            </ul>
        );
    }

    return safeText.split('\n').map((para, i) => (
        <span key={i} className="block mb-4 leading-relaxed">
            {processSentence(para)}
        </span>
    ));
};

/* --- STORY MODE --- */
const StoryMode: React.FC<{ story: any; cheatSheet: any[]; visualMnemonic?: string }> = ({ story, cheatSheet, visualMnemonic }) => {
  const { bionicReading, microChunking, bgTint, lineSpacing, syllableBreakdown, zenMode } = useAccessibility();
  const { playText, togglePlay, stop, isPlaying, text: audioText, speed, setSpeed, currentCharIndex } = useAudio();
  const storyRef = useRef<HTMLDivElement>(null);
  const [isHighlighterActive, setIsHighlighterActive] = useState(false);
  
  const themeStyles = getThemeStyles(bgTint);
  const safeStory = String(story || '');

  const handleTextSelection = () => {
    if (!isHighlighterActive) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().length === 0) return;
    const range = selection.getRangeAt(0);
    if (storyRef.current && storyRef.current.contains(range.commonAncestorContainer)) {
      try {
        const span = document.createElement('span');
        span.className = 'user-highlight';
        range.surroundContents(span);
        selection.removeAllRanges();
      } catch (e) {
        console.warn("Cannot highlight across multiple block elements.");
      }
    }
  };

  const renderKaraokeText = () => {
    const paragraphs = safeStory.split('\n').filter(p => p.trim());
    let cumulativeCharCount = 0;
    
    const textClasses = zenMode 
        ? "text-xl md:text-2xl leading-loose max-w-3xl mx-auto" 
        : `prose prose-sm md:prose-lg max-w-none ${themeStyles.text}`;

    return (
      <div 
        className={textClasses} 
        style={{ lineHeight: zenMode ? '2' : String(lineSpacing) }}
        onMouseUp={handleTextSelection}
      >
        {paragraphs.map((paragraph, pIdx) => {
          const sentences = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [paragraph];
          return (
            <p key={pIdx} className="mb-4 md:mb-6 relative">
              {sentences.map((sentence, sIdx) => {
                const startIndex = cumulativeCharCount;
                const safeSentence = String(sentence || '');
                const endIndex = startIndex + safeSentence.length;
                cumulativeCharCount += safeSentence.length;
                if (sIdx === sentences.length - 1) cumulativeCharCount += 1; 
                
                const isActive = isPlaying && String(audioText || '') === safeStory && (currentCharIndex >= startIndex && currentCharIndex < endIndex + 2);
                
                return (
                  <span 
                    key={sIdx}
                    className={`transition-colors duration-300 rounded px-0.5 ${
                        isActive 
                        ? 'bg-yellow-200 text-gray-900 box-decoration-clone dark:bg-teal-800 dark:text-white shadow-sm font-medium' 
                        : ''
                    }`}
                  >
                    {applyAccessibilityTransforms(safeSentence, { bionic: bionicReading, chunking: false, syllables: syllableBreakdown })}
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>
    );
  };

  const handlePlayPause = () => {
      if (String(audioText || '') !== safeStory) {
          playText(safeStory);
      } else {
          togglePlay();
      }
  };

  const handleSpeedChange = (delta: number) => {
      const next = Math.round((speed + delta) * 100) / 100;
      setSpeed(Math.max(0.5, Math.min(3.0, next)));
  };

  return (
    <div className={`flex flex-col h-full relative transition-all duration-500 ${themeStyles.container}`}>
       {!zenMode && (
        <div className={`flex-none p-2 md:p-3 flex items-center justify-between shadow-sm z-30 border-b ${themeStyles.border} ${bgTint !== 'default' ? 'bg-white/5' : 'bg-panel'}`}>
            <div className="flex items-center gap-2 md:gap-3">
                <button onClick={handlePlayPause} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center shadow-md">
                    {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                </button>
                <button onClick={stop} className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-700/50 hover:bg-red-500/20 hover:text-red-400 text-text-muted flex items-center justify-center">
                    <Square size={10} fill="currentColor" />
                </button>
                <div className="w-px h-6 md:h-8 bg-gray-700/30 mx-1"></div>
                 <button onClick={() => setIsHighlighterActive(!isHighlighterActive)} className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border shadow-sm ${isHighlighterActive ? 'bg-yellow-400 text-gray-900 border-yellow-500' : 'bg-gray-700/30 text-text-muted hover:text-text border-transparent'}`}>
                    <Highlighter size={16} />
                </button>
            </div>
            <div className="flex items-center gap-1 md:gap-2 bg-gray-700/20 rounded-lg p-1">
                <span className={`text-xs px-1 ${themeStyles.text}`}><Volume2 size={12}/></span>
                <button onClick={() => handleSpeedChange(-0.25)} className={`${themeStyles.text} hover:text-accent w-5 md:w-6 text-[10px] md:text-xs font-mono font-bold hover:bg-white/10 rounded`}>-</button>
                <span className="text-[10px] md:text-xs font-mono text-accent w-8 md:w-10 text-center font-bold">{speed.toFixed(2)}x</span>
                <button onClick={() => handleSpeedChange(0.25)} className={`${themeStyles.text} hover:text-accent w-5 md:w-6 text-[10px] md:text-xs font-mono font-bold hover:bg-white/10 rounded`}>+</button>
            </div>
        </div>
       )}
      <div className={`flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative ${themeStyles.text}`}>
        <div className={`max-w-3xl mx-auto animate-fadeIn pb-8 ${zenMode ? 'pt-6 md:pt-10' : ''}`} ref={storyRef}>
          {cheatSheet && Array.isArray(cheatSheet) && cheatSheet.length > 0 && !zenMode && (
            <div className="mb-6 md:mb-10 bg-[#fef9c3] dark:bg-[#422006] text-yellow-900 dark:text-yellow-100 p-4 md:p-6 rounded-sm shadow-xl rotate-1 transform border-t-8 border-yellow-400/50 relative">
              <div className="flex items-center gap-2 mb-3 md:mb-4 border-b border-yellow-800/10 pb-2">
                 <StickyNote size={20} className="text-yellow-600"/>
                 <h3 className="font-extrabold text-lg md:text-xl uppercase tracking-widest font-mono">Cheat Sheet</h3>
              </div>
              <ul className="space-y-2 md:space-y-3 font-medium text-base md:text-lg">
                {cheatSheet.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1.5">•</span>
                    <span>{applyAccessibilityTransforms(point, { bionic: bionicReading, chunking: false, syllables: syllableBreakdown })}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {visualMnemonic && !zenMode && (
            <div className={`mb-6 md:mb-10 border rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl ${themeStyles.border} ${bgTint === 'default' ? 'bg-panel' : 'bg-white/10'}`}>
              <div className={`px-4 py-2 md:px-6 md:py-3 border-b flex items-center justify-between ${themeStyles.border} bg-gray-700/10`}>
                 <div className="flex items-center gap-2">
                    <PenTool size={16} className="text-accent" />
                    <h3 className={`font-bold text-xs uppercase tracking-wider ${themeStyles.text}`}>Visual Vibe</h3>
                 </div>
              </div>
              <div className="p-4 md:p-10 flex justify-center bg-[#18181b]">
                <div className="w-full max-w-lg [&>svg]:w-full [&>svg]:h-auto" dangerouslySetInnerHTML={{ __html: String(visualMnemonic || '') }} />
              </div>
            </div>
          )}
          <div id="story-content">
             {renderKaraokeText()}
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- QUIZ MODE --- */
const QuizMode: React.FC<{ initialQuestions: QuizQuestion[] }> = ({ initialQuestions }) => {
    const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
    const [answers, setAnswers] = useState<Record<number, { isCorrect: boolean }>>({});
    const [showResult, setShowResult] = useState(false);
    const [isLoadingNew, setIsLoadingNew] = useState(false);
    const [quizSessionId, setQuizSessionId] = useState(0);
    const { setScore, setTotalQuestions, setWeakestCategory, topic } = useProgress();
    const { bgTint } = useAccessibility();
    const themeStyles = getThemeStyles(bgTint);

    useEffect(() => { 
        setQuestions(initialQuestions);
        setAnswers({});
        setShowResult(false); 
        setQuizSessionId(prev => prev + 1);
    }, [initialQuestions]);
    
    const handleAnswerResult = (index: number, isCorrect: boolean) => {
        setAnswers(prev => {
            const newAnswers = { ...prev, [index]: { isCorrect } };
            if (Object.keys(newAnswers).length === questions.length) {
                setShowResult(true);
            }
            return newAnswers;
        });
    };

    const currentScore = (Object.values(answers) as Array<{isCorrect: boolean}>).filter(a => a.isCorrect).length;
    const percentage = Math.round((currentScore / questions.length) * 100);

    const handleLoadNewQuiz = async () => {
        setIsLoadingNew(true);
        try {
            const newQs = await getAdvancedQuiz(topic);
            setQuestions(newQs);
            setAnswers({});
            setShowResult(false);
            setQuizSessionId(prev => prev + 1);
            setScore(0);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsLoadingNew(false);
        }
    };

    const getWeakestCategory = () => {
        const missedCounts: Record<string, number> = {};
        questions.forEach((q, i) => {
            if (answers[i] && !answers[i].isCorrect) {
                missedCounts[q.type] = (missedCounts[q.type] || 0) + 1;
            }
        });
        let maxMissed = 0;
        let weakest = "";
        Object.entries(missedCounts).forEach(([cat, count]) => {
            if (count > maxMissed) { maxMissed = count; weakest = cat; }
        });
        return weakest;
    };

    const weakestCat = getWeakestCategory();

    useEffect(() => {
        if (showResult) {
            setScore(currentScore);
            setTotalQuestions(questions.length);
            setWeakestCategory(weakestCat);
            if (percentage >= 80) {
              new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3').play().catch(() => {});
              confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#14b8a6', '#f59e0b', '#ffffff'] });
            } else {
              new Audio('https://assets.mixkit.co/active_storage/sfx/2882/2882-preview.mp3').play().catch(() => {});
            }
        }
    }, [showResult, percentage, currentScore, questions.length, weakestCat, setScore, setTotalQuestions, setWeakestCategory]);

    return (
        <div className={`h-full overflow-y-auto flex flex-col items-center p-4 md:p-10 scroll-smooth relative transition-all duration-500 ${themeStyles.container}`}>
            {isLoadingNew && (
                <div className="absolute inset-0 bg-panel/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fadeIn">
                    <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
                    <p className="text-xl font-bold animate-pulse">Generating advanced questions...</p>
                </div>
            )}
            
            <div className="w-full max-w-2xl space-y-8 pb-20">
                <div className={`${themeStyles.card} backdrop-blur-md p-4 rounded-xl border z-10 shadow-sm flex items-center gap-4`}>
                    <div className={`flex-1 h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden`}>
                        <div className="h-full bg-accent transition-all duration-500" style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }} />
                    </div>
                    <span className={`font-mono text-xs md:text-sm ${themeStyles.textMuted}`}>{Object.keys(answers).length}/{questions.length}</span>
                </div>

                <div className="space-y-8">
                    {questions.map((q, i) => (
                        <div key={`${quizSessionId}-${q.id || i}`} className="animate-slideUp">
                            <GamifiedQuestionCard question={q} onAnswer={(isCorrect) => handleAnswerResult(i, isCorrect)} />
                        </div>
                    ))}
                </div>

                {showResult && (
                    <div className={`animate-fadeIn p-6 md:p-8 ${themeStyles.card} border rounded-2xl shadow-2xl text-center space-y-6`}>
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <Award className={`w-8 h-8 md:w-10 md:h-10 ${percentage >= 80 ? 'text-yellow-500' : 'text-accent'}`} />
                        </div>
                        <div>
                            <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${themeStyles.text}`}>{percentage >= 80 ? "Mastery Achieved!" : "Quiz Complete"}</h2>
                            <p className={`${themeStyles.textMuted} mb-2 text-base md:text-lg`}>
                                {percentage >= 80 ? "Congratulations! Your concept is quite strong." : `You need more study. We detected a gap in your ${weakestCat || 'overall'} understanding.`}
                            </p>
                            <p className={themeStyles.textMuted}>You got <span className="text-accent font-bold">{currentScore}</span> out of <span className="font-bold">{questions.length}</span> correct.</p>
                        </div>
                        
                        {weakestCat && percentage < 80 && (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mx-auto max-w-sm text-left">
                                <div className="flex items-center gap-2 text-amber-500 mb-2">
                                    <Brain size={18} />
                                    <span className="font-bold uppercase text-xs tracking-wider text-amber-600 dark:text-amber-400">Blind-Spot Detected</span>
                                </div>
                                <p className="text-sm text-amber-800 dark:text-amber-200">You struggled most with <b>{weakestCat}</b> questions.</p>
                            </div>
                        )}

                        <div className="flex flex-wrap justify-center gap-3 md:gap-4 pt-4">
                            <button onClick={() => { setAnswers({}); setShowResult(false); setQuizSessionId(p => p + 1); }} className="px-5 md:px-6 py-2 md:py-3 rounded-xl bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium transition-all flex items-center gap-2 text-sm md:text-base">
                                <RotateCcw size={16} /> Reset Answers
                            </button>
                            <button onClick={handleLoadNewQuiz} className="px-5 md:px-6 py-2 md:py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium transition-all flex items-center gap-2 shadow-lg shadow-accent/20 text-sm md:text-base">
                                <RotateCw size={16} /> Load New Quiz
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const GamifiedQuestionCard: React.FC<{ question: QuizQuestion; onAnswer: (correct: boolean) => void; }> = ({ question, onAnswer }) => {
    const [status, setStatus] = useState<'unanswered' | 'correct' | 'incorrect'>('unanswered');
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [hint, setHint] = useState<string | null>(null);
    const [isLoadingHint, setIsLoadingHint] = useState(false);
    const [hasAttempted, setHasAttempted] = useState(false);
    const { topic } = useProgress();
    const { bgTint } = useAccessibility();
    const themeStyles = getThemeStyles(bgTint);

    const handleSelect = async (idx: number) => {
        if (status === 'correct') return;
        const isFirstClick = !hasAttempted;
        setHasAttempted(true);
        setSelectedIdx(idx);
        const selectedOptionText = String(question.options[idx] || '');
        const isCorrect = selectedOptionText === String(question.correctAnswer || '');

        if (isCorrect) {
            setStatus('correct');
            new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3').play().catch(() => {});
            if (isFirstClick) onAnswer(true);
        } else {
            setStatus('incorrect');
            new Audio('https://assets.mixkit.co/active_storage/sfx/2882/2882-preview.mp3').play().catch(() => {});
            if (isFirstClick) onAnswer(false);
            setIsLoadingHint(true);
            const newHint = await generateHint(String(question.question), String(selectedOptionText), String(question.correctAnswer), topic);
            setHint(newHint);
            setIsLoadingHint(false);
        }
    };

    return (
        <div className={`${themeStyles.card} p-5 md:p-8 rounded-2xl border transition-all duration-500 shadow-xl relative overflow-hidden ${status === 'correct' ? 'border-green-500/30' : themeStyles.border}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-accent uppercase tracking-widest bg-accent/10 px-2 py-0.5 rounded border border-accent/20">{String(question.type || 'Question')}</span>
            </div>
            <h3 className={`text-lg md:text-2xl font-bold mb-4 md:mb-6 leading-relaxed ${themeStyles.text}`}>{String(question.question || '')}</h3>
            <div className="space-y-2 md:space-y-3 mb-6">
                {question.options.map((opt, idx) => {
                    let btnClass = "w-full text-left p-3 md:p-4 rounded-xl border-2 transition-all flex justify-between items-center group ";
                    const isSelected = selectedIdx === idx;
                    const isCorrectOption = String(opt || '') === String(question.correctAnswer || '');
                    if (status === 'correct') {
                        if (isCorrectOption) btnClass += "bg-green-500/10 border-green-500 text-green-700 dark:text-green-300 shadow-sm";
                        else if (isSelected) btnClass += "bg-red-500/10 border-red-500 text-red-700 dark:text-red-300 opacity-50";
                        else btnClass += `${themeStyles.border} ${themeStyles.textMuted} opacity-30`;
                    } else {
                         if (isSelected && status === 'incorrect') btnClass += "bg-red-500/10 border-red-500 text-red-700 dark:text-red-300";
                         else btnClass += `${themeStyles.border} hover:border-gray-500 hover:bg-gray-500/10 ${themeStyles.text} hover:shadow-md`;
                    }
                    return (
                        <button key={idx} onClick={() => handleSelect(idx)} disabled={status === 'correct' || (status === 'incorrect' && isSelected)} className={btnClass}>
                            <span className="text-sm md:text-lg">{String(opt || '')}</span>
                            {status === 'correct' && isCorrectOption && <CheckCircle size={20} className="text-green-500" />}
                            {status === 'incorrect' && isSelected && <XCircle size={20} className="text-red-500" />}
                        </button>
                    )
                })}
            </div>
            {(hint || isLoadingHint) && status !== 'correct' && (
                <div className="bg-yellow-900/5 border-l-4 border-yellow-500 p-3 md:p-4 rounded-r-lg mb-2 animate-fadeIn">
                      <div className="flex gap-2 md:gap-3">
                          <HelpCircle size={18} className="text-yellow-600 dark:text-yellow-500" />
                          <div className="flex-1">
                             <span className="font-bold text-yellow-700 dark:text-yellow-500 text-[10px] md:text-xs uppercase block mb-1">Socratic Guidance</span>
                             {isLoadingHint ? <p className="text-yellow-700 dark:text-yellow-200 text-xs md:text-sm animate-pulse">Consulting AI Tutor...</p> : <p className={`text-sm md:text-base italic ${themeStyles.text}`}>"{String(hint || '')}"</p>}
                          </div>
                      </div>
                </div>
            )}
            {status === 'correct' && (
                <div className="bg-green-900/5 border-l-4 border-green-500 p-3 md:p-4 rounded-r-lg animate-fadeIn">
                      <div className="flex gap-2 md:gap-3">
                          <Info size={20} className="text-green-600 dark:text-green-500 shrink-0 mt-1" />
                          <div>
                             <span className="font-bold text-green-700 dark:text-green-400 text-xs md:text-sm block mb-1">Why it's right</span>
                             <p className={`text-sm md:text-base leading-relaxed ${themeStyles.text}`}>{String(question.explanation || "Great job!")}</p>
                          </div>
                      </div>
                </div>
            )}
        </div>
    );
};

/* --- MIND MAP MODE --- */
const MindMapMode: React.FC<{ rootTopic: string, initialNodes: MindMapNode[] }> = ({ rootTopic, initialNodes }) => {
  const [nodes, setNodes] = useState<MindMapNode[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [expandingId, setExpandingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const settings = useSettings();
  const { bgTint } = useAccessibility();
  const themeStyles = getThemeStyles(bgTint);

  useEffect(() => {
    const filteredNodes = initialNodes.filter(n => n.parentId === 'root' || n.id === 'root');
    setNodes(filteredNodes);
    const root = initialNodes.find(n => n.id === 'root') || { id: 'root', label: String(rootTopic || 'Concept Map'), description: "Main Topic" };
    setSelectedNode(root);
  }, [initialNodes, rootTopic]);

  useEffect(() => {
    const handleResize = () => { if (containerRef.current) setDimensions({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight }); };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;

  const handleNodeClick = async (node: MindMapNode) => {
    setSelectedNode(node);
    if (expandingId || node.id === 'root') return;
    const hasChildren = nodes.some(n => n.parentId === node.id);
    if (hasChildren) return; 
    setExpandingId(node.id);
    try {
      const newSubNodes = await expandMindMapNode(String(rootTopic || ''), String(node.label || ''), String(node.id || ''), settings.useMockMode);
      setNodes(prev => [...prev, ...newSubNodes]);
    } catch (err) { console.error("Zoom Error", err); } finally { setExpandingId(null); }
  };

  const allVisuals = useMemo(() => {
    const root = { id: 'root', label: rootTopic, x: centerX, y: centerY, level: 0, description: "Main Topic" };
    const level1 = nodes.filter(n => n.parentId === 'root').map((n, i, arr) => {
        const angle = (i / arr.length) * 2 * Math.PI - Math.PI / 2;
        const r = Math.min(centerX, centerY) * 0.55;
        return { ...n, x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r, level: 1 };
    });
    return [root, ...level1];
  }, [nodes, centerX, centerY, rootTopic]);

  const lineColor = bgTint === 'sepia' ? '#c2410c' : bgTint === 'blue' ? '#0369a1' : '#4b5563';

  return (
    <div className={`flex flex-col h-full relative transition-all duration-500 ${themeStyles.container}`}>
        <div className={`flex-1 relative overflow-hidden min-h-[400px] ${bgTint === 'default' ? 'bg-[#18181b]' : 'bg-transparent'}`} ref={containerRef}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {allVisuals.map(node => {
                    if (node.id === 'root') return null;
                    const parent = allVisuals.find(n => n.id === ((node as any).parentId || 'root'));
                    if (!parent) return null;
                    return ( <line key={`line-${node.id}`} x1={parent.x} y1={parent.y} x2={node.x} y2={node.y} stroke={lineColor} strokeWidth="2" strokeOpacity="0.3" strokeDasharray="5,5" /> );
                })}
            </svg>
            {allVisuals.map(node => {
                const isRoot = node.id === 'root';
                const isL2 = (node as any).level === 2;
                const isSelected = selectedNode?.id === node.id;
                const isLoading = expandingId === node.id;
                return (
                    <div key={node.id} onClick={() => handleNodeClick(node as MindMapNode)} className={`absolute z-10 cursor-pointer transition-all duration-500 transform -translate-x-1/2 -translate-y-1/2 ${isSelected ? 'scale-110 z-30' : 'hover:scale-105'}`} style={{ left: node.x, top: node.y }}>
                          {isLoading && <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping opacity-75"></div>}
                          <div className={`rounded-full flex items-center justify-center p-2 shadow-xl border-2 transition-colors relative ${isRoot ? 'w-20 h-20 md:w-28 md:h-28 bg-accent border-white/20' : isL2 ? 'w-12 h-12 md:w-16 md:h-16 bg-teal-500/20 border-teal-500 text-teal-800 dark:text-teal-100 backdrop-blur-md' : `${themeStyles.card} w-16 h-16 md:w-24 md:h-24 ${themeStyles.border} ${themeStyles.text}`}`}>
                             {isLoading ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin text-white" /> : <span className={`font-semibold text-center leading-tight line-clamp-3 ${isRoot ? 'text-[10px] md:text-sm text-white' : isL2 ? 'text-[8px] md:text-[10px]' : 'text-[9px] md:text-xs'}`}>{String(node.label || '')}</span>}
                          </div>
                    </div>
                );
            })}
        </div>
        <div className={`flex-none ${themeStyles.card} border-t h-32 md:h-52 overflow-y-auto custom-scrollbar relative`}>
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
                <div className="flex items-start gap-3 md:gap-5">
                    <Info className={`${themeStyles.icon} w-6 h-6 md:w-8 md:h-8 shrink-0`} />
                    <div>
                        <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1 block ${themeStyles.icon}`}>{selectedNode ? String(selectedNode.label || '') : "Concept Details"}</span>
                        <h3 className={`text-lg md:text-xl font-bold mb-2 ${themeStyles.text}`}>{expandingId ? "Expanding Concept..." : "Key Summary"}</h3>
                        <p className={`${themeStyles.textMuted} leading-relaxed text-xs md:text-base`}>{selectedNode ? String(selectedNode.description || '') : "Select a bubble to see details."}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

/* --- FLASHCARD MODE --- */
const FlashcardMode: React.FC<{ cards: Flashcard[] }> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const { bionicReading, microChunking, syllableBreakdown, zenMode, bgTint } = useAccessibility();
  const themeStyles = getThemeStyles(bgTint);

  const nextCard = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => (prev + 1) % cards.length), 300); };
  const prevCard = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length), 300); };
  
  const currentCard = cards[currentIndex];
  const accessibilitySettings = { bionic: bionicReading, chunking: microChunking, syllables: syllableBreakdown };
  const contentClasses = zenMode ? "text-xl md:text-2xl leading-loose max-w-3xl mx-auto" : `text-base md:text-2xl font-medium text-center leading-relaxed ${themeStyles.contrastText}`;

  return (
    <div className={`flex flex-col items-center justify-center h-full mx-auto pb-10 px-4 md:px-6 transition-all duration-500 ${themeStyles.container} ${zenMode ? 'max-w-4xl' : 'max-w-2xl'}`}>
      {!zenMode && <div className="mb-4 md:mb-6 flex gap-1.5 md:gap-2">{cards.map((_, idx) => ( <div key={idx} className={`h-1 md:h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 md:w-8 bg-accent' : 'w-1.5 md:w-2 bg-gray-400'}`} /> ))}</div>}
      <div className={`w-full perspective-1000 mb-6 md:mb-10 cursor-pointer group ${zenMode ? 'aspect-[2/1] md:aspect-[3/1]' : 'aspect-[4/3] md:aspect-[3/2]'}`} onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          <div className={`absolute inset-0 backface-hidden ${themeStyles.card} border rounded-2xl md:rounded-3xl flex flex-col shadow-2xl overflow-hidden`}>
              <div className="h-1.5 md:h-2 w-full bg-accent/20"></div>
              <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 text-center">
                <span className="text-[10px] md:text-xs font-bold text-accent tracking-[0.2em] uppercase mb-4">Topic</span>
                <h3 className={`${zenMode ? 'text-4xl md:text-6xl' : 'text-2xl md:text-5xl'} font-bold ${themeStyles.text}`}>{String(currentCard.term || '')}</h3>
             </div>
          </div>
          <div className={`absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br ${bgTint === 'sepia' ? 'from-orange-100 to-orange-200' : bgTint === 'blue' ? 'from-blue-100 to-blue-200' : 'from-gray-800 to-gray-900'} text-white rounded-2xl md:rounded-3xl flex flex-col shadow-2xl border ${themeStyles.border} overflow-hidden`}>
              <div className="bg-accent px-4 py-3 md:px-6 md:py-4 flex justify-between items-center"><h3 className="font-bold text-white text-base md:text-lg">{String(currentCard.term || '')}</h3></div>
              <div className="flex-1 flex items-center justify-center p-6 md:p-8 overflow-y-auto custom-scrollbar">
                 <div className={contentClasses}>{applyAccessibilityTransforms(currentCard.definition, accessibilitySettings)}</div>
              </div>
          </div>
        </div>
      </div>
      {!zenMode && (
        <div className="flex items-center gap-4 md:gap-6">
          <button onClick={prevCard} className={`px-4 md:px-8 py-2.5 md:py-4 rounded-xl md:rounded-2xl ${themeStyles.card} border ${themeStyles.text} transition-all active:scale-95 text-xs md:text-base`}>Previous</button>
          <span className={`text-sm md:text-xl font-mono ${themeStyles.textMuted} w-16 md:w-20 text-center font-bold`}>{currentIndex + 1} / {cards.length}</span>
          <button onClick={nextCard} className={`px-4 md:px-8 py-2.5 md:py-4 rounded-xl md:rounded-2xl ${themeStyles.card} border ${themeStyles.text} transition-all active:scale-95 text-xs md:text-base`}>Next</button>
        </div>
      )}
    </div>
  );
};

/* --- PREDICTIONS MODE --- */
const PredictionsMode: React.FC<{ predictions?: ExamPredictions }> = ({ predictions }) => {
    const { bionicReading, microChunking, syllableBreakdown, zenMode, bgTint } = useAccessibility();
    const themeStyles = getThemeStyles(bgTint);
    const [secretRevealed, setSecretRevealed] = useState(false);
    const [mcqRevealed, setMcqRevealed] = useState(false);

    if (!predictions) {
        return (
            <div className={`flex-1 flex flex-col items-center justify-center ${themeStyles.container} p-6 text-center`}>
               <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin mb-4" />
               <p className="text-sm md:text-base">Consulting with Senior Examiners...</p>
            </div>
        );
    }

    const accessibilitySettings = { bionic: bionicReading, chunking: microChunking, syllables: syllableBreakdown };
    const contentClasses = zenMode ? "text-xl md:text-2xl leading-loose max-w-3xl mx-auto" : `leading-relaxed text-base md:text-lg ${themeStyles.text}`;

    return (
        <div className={`h-full overflow-y-auto custom-scrollbar p-4 md:p-10 transition-all duration-500 ${themeStyles.container}`}>
            <div className={`mx-auto space-y-6 md:space-y-8 animate-fadeIn transition-all duration-500 ${zenMode ? 'max-w-4xl' : 'max-w-4xl'}`}>
                {!zenMode && (
                    <div className="text-center mb-6 md:mb-10">
                        <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-3 mb-2">
                            <Shield className="text-purple-500 w-6 h-6 md:w-8 md:h-8" /> 
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Examiner's Confidential</span>
                        </h2>
                        <p className={`text-[10px] md:text-sm uppercase tracking-widest border border-purple-500/30 inline-block px-3 py-1 rounded-full ${bgTint === 'sepia' || bgTint === 'blue' ? 'bg-purple-100 text-purple-800' : 'bg-purple-900/10 text-purple-400'}`}>Top Secret • For Your Eyes Only</p>
                    </div>
                )}

                <div className={`${themeStyles.card} border-red-500/30 rounded-2xl overflow-hidden shadow-2xl relative transition-all duration-500 ${zenMode ? 'border-none shadow-none bg-transparent' : 'border'}`}>
                    {!zenMode && <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] md:text-xs font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-bl-xl shadow-lg z-10">90% PROBABILITY</div>}
                    <div className={`p-5 md:p-8 ${!zenMode ? 'bg-gradient-to-br from-red-500/5 to-transparent' : ''}`}>
                        <div className={`flex items-start gap-3 md:gap-4 mb-4 ${zenMode ? 'justify-center text-center' : ''}`}>
                            {!zenMode && <div className="bg-red-500/10 p-2 md:p-3 rounded-lg text-red-500 shrink-0"><FileText size={20} /></div>}
                            <div className={zenMode ? 'w-full' : ''}>
                                {!zenMode && <h3 className="text-red-500 font-bold uppercase tracking-wider text-[10px] md:text-sm mb-1">5 Marks • High Probability</h3>}
                                <div className={`${zenMode ? 'text-3xl md:text-5xl mb-10' : 'text-lg md:text-2xl'} font-bold ${themeStyles.text} leading-relaxed`}>
                                    {applyAccessibilityTransforms(predictions.longAnswer.question, { ...accessibilitySettings, chunking: false })}
                                </div>
                            </div>
                        </div>
                        <div className={`${!zenMode ? `${themeStyles.innerMuted} rounded-xl p-4 md:p-5 border border-white/5` : ''} mb-6`}>
                            {!zenMode && <h4 className={`text-xs font-bold ${themeStyles.textMuted} uppercase mb-3`}>Model Answer Key</h4>}
                            <div className={contentClasses}>
                                {applyAccessibilityTransforms(predictions.longAnswer.modelAnswer, accessibilitySettings)}
                            </div>
                        </div>
                        {!zenMode && (
                          <>
                            <button onClick={() => setSecretRevealed(!secretRevealed)} className={`w-full py-3 md:py-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all group ${secretRevealed ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-300' : `${themeStyles.border} text-gray-500 hover:text-gray-700 dark:hover:text-gray-200`}`}>
                                {secretRevealed ? <Unlock size={16} /> : <Lock size={16} />}
                                <span className="font-bold tracking-wider text-xs md:text-sm">{secretRevealed ? "EXAMINER SECRET REVEALED" : "TAP TO REVEAL EXAMINER SECRET"}</span>
                            </button>
                            {secretRevealed && (
                                <div className="mt-4 p-3 md:p-4 bg-purple-500/10 border-l-4 border-purple-500 rounded-r-xl animate-slideUp">
                                    <div className="text-purple-900 dark:text-purple-200 italic font-medium text-sm md:text-base">"{applyAccessibilityTransforms(predictions.longAnswer.examinerSecret, { ...accessibilitySettings, chunking: false })}"</div>
                                </div>
                            )}
                          </>
                        )}
                    </div>
                </div>

                {!zenMode && (
                  <div className="grid md:grid-cols-2 gap-4 md:gap-6 pb-12">
                      <div className={`${themeStyles.card} border-amber-500/30 rounded-2xl overflow-hidden shadow-lg flex flex-col border`}>
                           <div className="bg-amber-500/10 p-3 md:p-4 border-b border-amber-500/20 flex items-center gap-2 md:gap-3"><AlertTriangle className="text-amber-500" size={18} /><h3 className="font-bold text-amber-500 uppercase tracking-wider text-[10px] md:text-sm">Student Trap (2 Marks)</h3></div>
                           <div className="p-5 md:p-6 flex-1 flex flex-col">
                               <div className={`font-bold text-base md:text-lg mb-4 ${themeStyles.text}`}>{applyAccessibilityTransforms(predictions.shortReasoning.question, { ...accessibilitySettings, chunking: false })}</div>
                               <div className={`flex-1 ${themeStyles.innerMuted} rounded-lg p-3 md:p-4 mb-4 border border-white/5 text-sm md:text-base`}>
                                  <div className={contentClasses}>{applyAccessibilityTransforms(predictions.shortReasoning.answer, accessibilitySettings)}</div>
                               </div>
                               <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase block mb-1">⚠️ Where students fail:</span>
                                  <div className="text-amber-900 dark:text-amber-200 text-xs md:text-sm">{applyAccessibilityTransforms(predictions.shortReasoning.studentTrap, { ...accessibilitySettings, chunking: false })}</div>
                               </div>
                           </div>
                      </div>
                      <div className={`${themeStyles.card} border-blue-500/30 rounded-2xl overflow-hidden shadow-lg flex flex-col border`}>
                           <div className="bg-blue-500/10 p-3 md:p-4 border-b border-blue-500/20 flex items-center gap-2 md:gap-3"><Target className="text-blue-500" size={18} /><h3 className="font-bold text-blue-500 uppercase tracking-wider text-[10px] md:text-sm">Precision Check (MCQ)</h3></div>
                           <div className="p-5 md:p-6 flex-1 flex flex-col">
                               <div className={`font-bold text-base md:text-lg mb-4 ${themeStyles.text}`}>{applyAccessibilityTransforms(predictions.mcq.question, { ...accessibilitySettings, chunking: false })}</div>
                               <div className="space-y-1.5 md:space-y-2 mb-4">
                                   {predictions.mcq.options.map((opt, i) => (
                                       <div key={i} className={`p-2 text-xs md:text-sm rounded border ${mcqRevealed && String(opt || '') === String(predictions.mcq.correct || '') ? 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300' : `${themeStyles.innerMuted} border-gray-400 dark:border-gray-700 ${themeStyles.textMuted}`}`}>
                                            {applyAccessibilityTransforms(opt, { ...accessibilitySettings, chunking: false })} 
                                            {mcqRevealed && String(opt || '') === String(predictions.mcq.correct || '') && <CheckCircle size={12} className="inline ml-1.5 text-green-600 dark:text-green-500"/>}
                                       </div>
                                   ))}
                               </div>
                               {!mcqRevealed ? ( <button onClick={() => setMcqRevealed(true)} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs md:text-sm transition-colors shadow-lg">Reveal Answer & Twist</button> ) : ( <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 animate-fadeIn"><span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase block mb-1">Target Twist:</span><div className="text-blue-900 dark:text-blue-200 text-xs md:text-sm">{applyAccessibilityTransforms(predictions.mcq.twist, { ...accessibilitySettings, chunking: false })}</div></div> )}
                           </div>
                      </div>
                  </div>
                )}
            </div>
        </div>
    );
};

/* --- MAIN COMPONENT --- */
const KnowledgeDisplay: React.FC<KnowledgeDisplayProps> = ({ data, isProcessing }) => {
  const [activeTab, setActiveTab] = useState<TabType>('story');
  const { setTopic } = useProgress();
  const { bgTint } = useAccessibility();
  const themeStyles = getThemeStyles(bgTint);

  useEffect(() => {
    if (data?.mindMap?.root) {
      setTopic(data.mindMap.root);
    }
  }, [data, setTopic]);

  const renderContent = () => {
    if (isProcessing) {
      return (
        <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 animate-pulse-glow ${themeStyles.container}`}>
          <div className="w-16 h-16 md:w-24 md:h-24 bg-panel rounded-full flex items-center justify-center mb-6 shadow-xl">
            <Network className="w-8 h-8 md:w-12 md:h-12 text-accent animate-pulse" />
          </div>
          <h2 className={`text-xl md:text-2xl font-bold mb-2 ${themeStyles.text}`}>CogniVibe AI is Thinking...</h2>
          <p className={`${themeStyles.textMuted} max-w-md text-sm md:text-base`}>Analyzing context, generating analogies...</p>
        </div>
      );
    }

    if (!data) {
      return (
        <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50 ${themeStyles.container}`}>
          <div className="w-16 h-16 md:w-24 md:h-24 bg-panel rounded-full flex items-center justify-center mb-6 grayscale">
            <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-gray-500" />
          </div>
          <h2 className={`text-lg md:text-xl font-bold mb-2 ${themeStyles.text}`}>Ready to Learn</h2>
          <p className={`${themeStyles.textMuted} max-w-sm text-sm md:text-base`}>Upload notes or diagrams on the left to begin.</p>
        </div>
      );
    }

    // Wrap imported DebateMode to provide theme container
    const wrappedContent = (() => {
      switch (activeTab) {
        case 'story': return <StoryMode story={data.story.narrative} cheatSheet={data.story.cheatSheet} visualMnemonic={data.story.visualVibe.svg_code} />;
        case 'quiz': return <QuizMode initialQuestions={data.quiz} />;
        case 'mindmap': return <MindMapMode rootTopic={data.mindMap?.root || "Concept Map"} initialNodes={data.mindMap?.nodes || []} />;
        case 'flashcards': return <FlashcardMode cards={data.flashcards} />;
        case 'examleak': return <PredictionsMode predictions={data.examPredictions} />;
        case 'debate': return <div className={`h-full overflow-hidden transition-all duration-500 ${themeStyles.container}`}><DebateMode topic={data.mindMap?.root || "Selected Topic"} /></div>;
        default: return null;
      }
    })();

    return wrappedContent;
  };

  return (
    <div className={`h-full flex flex-col transition-all duration-500 ${themeStyles.container}`}>
      <div className={`flex items-center px-4 md:px-6 pt-2 md:pt-4 border-b ${themeStyles.border} bg-white/5 backdrop-blur-md overflow-x-auto no-scrollbar shrink-0 z-20 shadow-sm scroll-smooth`}>
        <TabButton active={activeTab === 'story'} onClick={() => setActiveTab('story')} icon={<BookOpen size={18} />} label="Story Mode" tint={bgTint} />
        <TabButton active={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')} icon={<HelpCircle size={18} />} label="Quiz Mode" tint={bgTint} />
        <TabButton active={activeTab === 'mindmap'} onClick={() => setActiveTab('mindmap')} icon={<Network size={18} />} label="Mind Map" tint={bgTint} />
        <TabButton active={activeTab === 'flashcards'} onClick={() => setActiveTab('flashcards')} icon={<Zap size={18} />} label="Flashcards" tint={bgTint} />
        <TabButton active={activeTab === 'debate'} onClick={() => setActiveTab('debate')} icon={<Swords size={18} />} label="Debate Dojo" tint={bgTint} />
        <TabButton active={activeTab === 'examleak'} onClick={() => setActiveTab('examleak')} icon={<Sparkles size={18} className="text-purple-500" />} label="Predictions" isSpecial tint={bgTint} />
      </div>
      <div className="flex-1 overflow-hidden relative">{renderContent()}</div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; isSpecial?: boolean; tint: string }> = ({ active, onClick, icon, label, isSpecial, tint }) => {
  const isLight = tint === 'sepia' || tint === 'blue';
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm transition-all border-b-2 whitespace-nowrap ${active ? (isSpecial ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-500/10' : 'border-accent text-accent') : `border-transparent ${isLight ? 'text-gray-600 hover:text-gray-900' : 'text-text-muted hover:text-text'} hover:bg-black/5`}`}>
      {icon} {label}
    </button>
  );
};

export default KnowledgeDisplay;