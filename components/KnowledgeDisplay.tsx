import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, HelpCircle, Network, Zap, Volume2, RotateCw, StickyNote, 
  CheckCircle, XCircle, Info, Play, Pause, Square, PenTool, Award, 
  ArrowRight, RotateCcw, Highlighter, Shield, FileText, AlertTriangle, 
  Target, Lock, Unlock, Loader2, Sparkles, Brain, Swords
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
 * Robust Accessibility Text Transformer (Universal Helper)
 * Handles Bionic Reading, Syllable Breakdown, and Micro-Chunking safely.
 */
const applyAccessibilityTransforms = (text: any, settings: { bionic: boolean; chunking: boolean; syllables: boolean }) => {
    const { bionic, chunking, syllables } = settings;
    // Safety check: Ensure text is always a valid string to prevent .split() crashes
    const safeText = String(text || '');

    const transformWord = (word: string) => {
        let processed = word;
        
        // 1. Syllable Breakdown (Approximate patterns for demo)
        if (syllables && word.length > 3) {
            processed = processed.replace(/([aeiouy]{1,2}[^aeiouy]{0,2})/gi, '$1·').replace(/·$/, '');
        }

        // 2. Bionic Reading (Bold first half)
        if (bionic) {
            const splitIndex = Math.ceil(processed.length / 2);
            const boldPart = processed.slice(0, splitIndex);
            const restPart = processed.slice(splitIndex);
            return <React.Fragment key={word + Math.random()}><b className="font-bold">{boldPart}</b>{restPart}</React.Fragment>;
        }

        return processed;
    };

    const processSentence = (sentence: string) => {
        const words = sentence.split(/(\s+)/); // Preserve whitespace
        return words.map((part, i) => {
            if (/\s+/.test(part)) return part;
            return <React.Fragment key={i}>{transformWord(part)}</React.Fragment>;
        });
    };

    // 3. Micro-Chunking (Bullet Points for sentences)
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

    // Default: Multi-line support with paragraph breaks
    return safeText.split('\n').map((para, i) => (
        <span key={i} className="block mb-4 leading-relaxed">
            {processSentence(para)}
        </span>
    ));
};

const KnowledgeDisplay: React.FC<KnowledgeDisplayProps> = ({ data, isProcessing }) => {
  const [activeTab, setActiveTab] = useState<TabType>('story');
  const { setTopic } = useProgress();

  useEffect(() => {
    if (data?.mindMap?.root) {
      setTopic(data.mindMap.root);
    }
  }, [data, setTopic]);

  const renderContent = () => {
    if (isProcessing) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-pulse-glow">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-panel rounded-full flex items-center justify-center mb-6">
            <Network className="w-8 h-8 md:w-12 md:h-12 text-accent animate-pulse" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-2">CogniVibe AI is Thinking...</h2>
          <p className="text-text-muted max-w-md text-sm md:text-base">
            Analyzing context, generating analogies, and drawing diagrams...
          </p>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-panel rounded-full flex items-center justify-center mb-6 grayscale">
            <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-gray-500" />
          </div>
          <h2 className="text-lg md:text-xl font-bold mb-2">Ready to Learn</h2>
          <p className="text-text-muted max-w-sm text-sm md:text-base">
            Upload notes or diagrams on the left to begin.
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case 'story':
        return <StoryMode 
                  story={data.story.narrative} 
                  cheatSheet={data.story.cheatSheet} 
                  visualMnemonic={data.story.visualVibe.svg_code} 
               />;
      case 'quiz':
        return <QuizMode initialQuestions={data.quiz} />;
      case 'mindmap':
        return <MindMapMode 
                  rootTopic={data.mindMap?.root || "Concept Map"} 
                  initialNodes={data.mindMap?.nodes || []} 
               />;
      case 'flashcards':
        return <FlashcardMode cards={data.flashcards} />;
      case 'examleak':
        return <PredictionsMode predictions={data.examPredictions} />;
      case 'debate':
        return <DebateMode topic={data.mindMap?.root || "Selected Topic"} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-panel/50 text-text">
      {/* Tab Navigation */}
      <div className="flex items-center px-4 md:px-6 pt-2 md:pt-4 border-b border-gray-700/50 bg-panel overflow-x-auto no-scrollbar shrink-0 z-20 shadow-sm scroll-smooth">
        <TabButton 
          active={activeTab === 'story'} 
          onClick={() => setActiveTab('story')} 
          icon={<BookOpen size={18} />} 
          label="Story Mode" 
        />
        <TabButton 
          active={activeTab === 'quiz'} 
          onClick={() => setActiveTab('quiz')} 
          icon={<HelpCircle size={18} />} 
          label="Quiz Mode" 
        />
        <TabButton 
          active={activeTab === 'mindmap'} 
          onClick={() => setActiveTab('mindmap')} 
          icon={<Network size={18} />} 
          label="Mind Map" 
        />
        <TabButton 
          active={activeTab === 'flashcards'} 
          onClick={() => setActiveTab('flashcards')} 
          icon={<Zap size={18} />} 
          label="Flashcards" 
        />
        <TabButton 
          active={activeTab === 'debate'} 
          onClick={() => setActiveTab('debate')} 
          icon={<Swords size={18} />} 
          label="Debate Dojo" 
        />
        <TabButton 
          active={activeTab === 'examleak'} 
          onClick={() => setActiveTab('examleak')} 
          icon={<Sparkles size={18} className="text-purple-400" />} 
          label="Predictions" 
          isSpecial
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {renderContent()}
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; isSpecial?: boolean }> = ({ active, onClick, icon, label, isSpecial }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm transition-all border-b-2 whitespace-nowrap ${
      active
        ? isSpecial ? 'border-purple-500 text-purple-400 bg-purple-500/10' : 'border-accent text-accent'
        : 'border-transparent text-text-muted hover:text-text hover:bg-gray-700/10'
    }`}
  >
    {icon}
    {label}
  </button>
);

/* --- STORY MODE --- */
const StoryMode: React.FC<{ story: any; cheatSheet: any[]; visualMnemonic?: string }> = ({ story, cheatSheet, visualMnemonic }) => {
  const { bionicReading, microChunking, bgTint, lineSpacing, syllableBreakdown, zenMode } = useAccessibility();
  const { playText, togglePlay, stop, isPlaying, text: audioText, speed, setSpeed, currentCharIndex } = useAudio();
  const storyRef = useRef<HTMLDivElement>(null);
  const [isHighlighterActive, setIsHighlighterActive] = useState(false);
  
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

  const handleHighlightClick = (e: React.MouseEvent) => {
    if (!isHighlighterActive) return;
    const target = e.target as HTMLElement;
    if (target.classList.contains('user-highlight')) {
      const parent = target.parentNode;
      if (parent) {
        while (target.firstChild) {
          parent.insertBefore(target.firstChild, target);
        }
        parent.removeChild(target);
      }
    }
  };

  const renderKaraokeText = () => {
    const paragraphs = safeStory.split('\n').filter(p => p.trim());
    let cumulativeCharCount = 0;
    
    // Zen Mode Focused Typography
    const textClasses = zenMode 
        ? "text-xl md:text-2xl leading-loose max-w-3xl mx-auto" 
        : "prose prose-sm md:prose-lg max-w-none";

    return (
      <div 
        className={textClasses} 
        style={{ lineHeight: zenMode ? '2' : String(lineSpacing) }}
        onMouseUp={handleTextSelection}
        onClick={handleHighlightClick}
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

  const themeStyles = (() => {
      const tint = bgTint || 'default';
      switch(tint) {
          case 'sepia': return { container: 'bg-[#F5E6D3]', text: 'text-gray-900', border: 'border-yellow-900/10' };
          case 'blue': return { container: 'bg-[#E0F7FA]', text: 'text-gray-900', border: 'border-blue-900/10' };
          case 'black': return { container: 'bg-[#000000]', text: 'text-gray-100', border: 'border-gray-800' };
          default: return { container: '', text: 'text-text', border: 'border-gray-700/50' };
      }
  })();

  return (
    <div className={`flex flex-col h-full relative transition-colors duration-500 ${themeStyles.container}`}>
       {!zenMode && (
        <div className={`flex-none p-2 md:p-3 flex items-center justify-between shadow-sm z-30 border-b ${themeStyles.border} ${bgTint !== 'default' ? 'bg-transparent' : 'bg-panel'}`}>
            <div className="flex items-center gap-2 md:gap-3">
                <button 
                    onClick={handlePlayPause}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center transition-transform active:scale-95 shadow-md"
                >
                    {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                </button>
                <button 
                    onClick={stop}
                    className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-700/50 hover:bg-red-500/20 hover:text-red-400 text-text-muted flex items-center justify-center transition-all border border-transparent"
                >
                    <Square size={10} fill="currentColor" />
                </button>
                <div className="w-px h-6 md:h-8 bg-gray-700/30 mx-1"></div>
                 <button 
                    onClick={() => setIsHighlighterActive(!isHighlighterActive)}
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all border shadow-sm ${
                        isHighlighterActive 
                        ? 'bg-yellow-400 text-gray-900 border-yellow-500' 
                        : 'bg-gray-700/30 text-text-muted hover:text-text border-transparent'
                    }`}
                >
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
                <div 
                  className="w-full max-w-lg [&>svg]:w-full [&>svg]:h-auto"
                  dangerouslySetInnerHTML={{ __html: String(visualMnemonic || '') }} 
                />
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
    const settings = useSettings();

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

    const handleLoadNewQuiz = async () => {
        setIsLoadingNew(true);
        try {
            const newQs = await getAdvancedQuiz(topic, settings.apiKey);
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

    const currentScore = Object.values(answers).filter(a => a.isCorrect).length;
    const percentage = Math.round((currentScore / questions.length) * 100);

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
            if (count > maxMissed) {
                maxMissed = count;
                weakest = cat;
            }
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
              confetti({ 
                particleCount: 150, 
                spread: 70, 
                origin: { y: 0.6 }, 
                colors: ['#14b8a6', '#f59e0b', '#ffffff'] 
              });
            } else {
              new Audio('https://assets.mixkit.co/active_storage/sfx/2882/2882-preview.mp3').play().catch(() => {});
            }
        }
    }, [showResult, percentage, currentScore, questions.length, weakestCat, setScore, setTotalQuestions, setWeakestCategory]);

    return (
        <div className="h-full overflow-y-auto no-scrollbar flex flex-col items-center p-4 md:p-10 scroll-smooth relative">
            {isLoadingNew && (
                <div className="absolute inset-0 bg-panel/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fadeIn">
                    <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
                    <p className="text-xl font-bold animate-pulse">Generating advanced questions...</p>
                </div>
            )}
            
            <div className="w-full max-w-2xl space-y-8 pb-20">
                <div className="sticky top-0 bg-panel/80 backdrop-blur-md p-4 rounded-xl border border-gray-700/30 z-10 shadow-sm flex items-center gap-4">
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-accent transition-all duration-500" style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }} />
                    </div>
                    <span className="font-mono text-xs md:text-sm text-text-muted">{Object.keys(answers).length}/{questions.length}</span>
                </div>

                <div className="space-y-8">
                    {questions.map((q, i) => (
                        <div key={`${quizSessionId}-${q.id || i}`} className="animate-slideUp">
                            <GamifiedQuestionCard 
                                question={q} 
                                onAnswer={(isCorrect) => handleAnswerResult(i, isCorrect)}
                            />
                        </div>
                    ))}
                </div>

                {showResult && (
                    <div className="animate-fadeIn p-6 md:p-8 bg-panel border border-accent/30 rounded-2xl shadow-2xl text-center space-y-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <Award className={`w-8 h-8 md:w-10 md:h-10 ${percentage >= 80 ? 'text-yellow-500' : 'text-accent'}`} />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-2">
                                {percentage >= 80 ? "Mastery Achieved!" : "Quiz Complete"}
                            </h2>
                            <p className="text-text-muted mb-2 text-base md:text-lg">
                                {percentage >= 80 
                                    ? "Congratulations! Your concept is quite strong." 
                                    : `You need more study. We detected a gap in your ${weakestCat || 'overall'} understanding.`
                                }
                            </p>
                            <p className="text-text-muted">You got <span className="text-accent font-bold">{currentScore}</span> out of <span className="font-bold">{questions.length}</span> correct.</p>
                        </div>
                        
                        {weakestCat && percentage < 80 && (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mx-auto max-w-sm text-left">
                                <div className="flex items-center gap-2 text-amber-500 mb-2">
                                    <Brain size={18} />
                                    <span className="font-bold uppercase text-xs tracking-wider">Blind-Spot Detected</span>
                                </div>
                                <p className="text-sm text-amber-200">
                                    You struggled most with <b>{weakestCat}</b> questions. Focus on the Exam Predictions tab for specific tips.
                                </p>
                            </div>
                        )}

                        <div className="flex flex-wrap justify-center gap-3 md:gap-4 pt-4">
                            <button onClick={() => { setAnswers({}); setShowResult(false); setQuizSessionId(p => p + 1); }} className="px-5 md:px-6 py-2 md:py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-all flex items-center gap-2 text-sm md:text-base">
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
    const settings = useSettings();

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
            if (isFirstClick) {
                onAnswer(true);
            }
        } else {
            setStatus('incorrect');
            new Audio('https://assets.mixkit.co/active_storage/sfx/2882/2882-preview.mp3').play().catch(() => {});
            
            if (isFirstClick) {
                onAnswer(false);
            }

            setIsLoadingHint(true);
            const correctAnswerText = String(question.correctAnswer || '');
            const newHint = await generateHint(
              String(question.question || ''), 
              String(selectedOptionText || ''), 
              correctAnswerText, 
              "General Study Topic",
              settings.apiKey
            );
            setHint(newHint);
            setIsLoadingHint(false);
        }
    };

    return (
        <div className={`bg-panel p-5 md:p-8 rounded-2xl border transition-all duration-500 shadow-xl relative overflow-hidden ${status === 'correct' ? 'border-green-500/30' : 'border-gray-700/50'}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-accent uppercase tracking-widest bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                {String(question.type || 'Question')}
              </span>
            </div>
            <h3 className="text-lg md:text-2xl font-bold text-text mb-4 md:mb-6 leading-relaxed">{String(question.question || '')}</h3>
            
            <div className="space-y-2 md:space-y-3 mb-6">
                {question.options.map((opt, idx) => {
                    let btnClass = "w-full text-left p-3 md:p-4 rounded-xl border-2 transition-all flex justify-between items-center group ";
                    const isSelected = selectedIdx === idx;
                    const isCorrectOption = String(opt || '') === String(question.correctAnswer || '');
                    
                    if (status === 'correct') {
                        if (isCorrectOption) btnClass += "bg-green-500/10 border-green-500 text-green-600 dark:text-green-300 shadow-sm";
                        else if (isSelected) btnClass += "bg-red-500/10 border-red-500 text-red-600 dark:text-red-300 opacity-50";
                        else btnClass += "border-gray-700/50 text-text-muted opacity-30";
                    } else {
                         if (isSelected && status === 'incorrect') btnClass += "bg-red-500/10 border-red-500 text-red-600 dark:text-red-300";
                         else btnClass += "border-gray-700/50 hover:border-gray-500 hover:bg-gray-700/30 text-text hover:shadow-md";
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
                <div className="bg-yellow-900/10 border-l-4 border-yellow-500 p-3 md:p-4 rounded-r-lg mb-2 animate-fadeIn">
                      <div className="flex gap-2 md:gap-3">
                          <HelpCircle size={18} className="text-yellow-600 dark:text-yellow-500" />
                          <div className="flex-1">
                             <span className="font-bold text-yellow-700 dark:text-yellow-500 text-[10px] md:text-xs uppercase block mb-1">Socratic Guidance</span>
                             {isLoadingHint ? <p className="text-yellow-700 dark:text-yellow-200 text-xs md:text-sm animate-pulse">Consulting AI Tutor...</p> : <p className="text-yellow-800 dark:text-yellow-100 text-sm md:text-base italic">"{String(hint || '')}"</p>}
                          </div>
                      </div>
                </div>
            )}

            {status === 'correct' && (
                <div className="bg-green-900/10 border-l-4 border-green-500 p-3 md:p-4 rounded-r-lg animate-fadeIn">
                      <div className="flex gap-2 md:gap-3">
                          <Info size={20} className="text-green-600 dark:text-green-500 shrink-0 mt-1" />
                          <div>
                             <span className="font-bold text-green-700 dark:text-green-400 text-xs md:text-sm block mb-1">Why it's right</span>
                             <p className="text-green-800 dark:text-green-100 text-sm md:text-base leading-relaxed">{String(question.explanation || "Great job!")}</p>
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

  useEffect(() => {
    const filteredNodes = initialNodes.filter(n => n.parentId === 'root' || n.id === 'root');
    setNodes(filteredNodes);
    const root = initialNodes.find(n => n.id === 'root') || { id: 'root', label: String(rootTopic || 'Concept Map'), description: "Main Topic" };
    setSelectedNode(root);
  }, [initialNodes, rootTopic]);

  useEffect(() => {
    const handleResize = () => {
        if (containerRef.current) {
          setDimensions({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
        }
    };
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
      const newSubNodes = await expandMindMapNode(String(rootTopic || ''), String(node.label || ''), String(node.id || ''), settings.useMockMode, settings.apiKey);
      setNodes(prev => [...prev, ...newSubNodes]);
    } catch (err) {
      console.error("Zoom Error", err);
    } finally {
      setExpandingId(null);
    }
  };

  const renderVisuals = () => {
    const rootNodeVisual = { id: 'root', label: String(rootTopic || ''), x: centerX, y: centerY, level: 0 };
    const level1Nodes = nodes.filter(n => n.parentId === 'root');
    const radiusL1 = Math.min(centerX, centerY) * 0.55;
    const mappedL1 = level1Nodes.map((n, i) => {
        const angle = (i / Math.max(1, level1Nodes.length)) * 2 * Math.PI - Math.PI / 2;
        return { ...n, x: centerX + Math.cos(angle) * radiusL1, y: centerY + Math.sin(angle) * radiusL1, level: 1 };
    });
    let mappedL2: any[] = [];
    nodes.filter(n => n.parentId && n.parentId !== 'root').forEach(childNode => {
        const parentVisual = mappedL1.find(p => p.id === childNode.parentId);
        if (parentVisual) {
            const siblings = nodes.filter(n => n.parentId === childNode.parentId);
            const myIndex = siblings.indexOf(childNode);
            const angle = (myIndex / Math.max(1, siblings.length)) * 2 * Math.PI;
            mappedL2.push({ ...childNode, x: parentVisual.x + Math.cos(angle) * 70, y: parentVisual.y + Math.sin(angle) * 70, level: 2 });
        }
    });
    return [rootNodeVisual, ...mappedL1, ...mappedL2];
  };

  const allVisuals = renderVisuals();

  return (
    <div className="flex flex-col h-full relative">
        <div className="flex-1 relative bg-[#252525] overflow-hidden min-h-[400px]" ref={containerRef}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {allVisuals.map(node => {
                    if (node.id === 'root') return null;
                    const parent = allVisuals.find(n => n.id === ((node as any).parentId || 'root'));
                    if (!parent) return null;
                    return ( <line key={`line-${node.id}`} x1={parent.x} y1={parent.y} x2={node.x} y2={node.y} stroke={node.level === 2 ? "#14b8a6" : "#4b5563"} strokeWidth="2" strokeOpacity="0.5" strokeDasharray={node.level === 2 ? "0" : "5,5"} /> );
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
                          <div className={`rounded-full flex items-center justify-center p-2 shadow-xl border-2 transition-colors relative ${isRoot ? 'w-20 h-20 md:w-28 md:h-28 bg-accent border-[#252525]' : isL2 ? 'w-12 h-12 md:w-16 md:h-16 bg-teal-500/20 border-teal-500 text-teal-100 backdrop-blur-md' : 'w-16 h-16 md:w-24 md:h-24 bg-panel border-gray-600 text-gray-300'}`}>
                             {isLoading ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin text-white" /> : <span className={`font-semibold text-center leading-tight line-clamp-3 ${isRoot ? 'text-[10px] md:text-sm text-white' : isL2 ? 'text-[8px] md:text-[10px]' : 'text-[9px] md:text-xs'}`}>{String(node.label || '')}</span>}
                          </div>
                    </div>
                );
            })}
        </div>
        <div className="flex-none bg-panel border-t border-gray-700/50 h-32 md:h-52 overflow-y-auto custom-scrollbar relative">
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
                <div className="flex items-start gap-3 md:gap-5">
                    <Info className="text-accent w-6 h-6 md:w-8 md:h-8 shrink-0" />
                    <div>
                        <span className="text-[10px] md:text-xs font-bold text-accent uppercase tracking-widest mb-1 block">{selectedNode ? String(selectedNode.label || '') : "Concept Details"}</span>
                        <h3 className="text-lg md:text-xl font-bold text-text mb-2">{expandingId ? "Expanding Concept..." : "Key Summary"}</h3>
                        <p className="text-text-muted leading-relaxed text-xs md:text-base">{selectedNode ? String(selectedNode.description || '') : "Select a bubble to see details."}</p>
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
  const { bionicReading, microChunking, syllableBreakdown, zenMode } = useAccessibility();

  const nextCard = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => (prev + 1) % cards.length), 300); };
  const prevCard = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length), 300); };
  
  const currentCard = cards[currentIndex];
  const accessibilitySettings = { bionic: bionicReading, chunking: microChunking, syllables: syllableBreakdown };

  // Focus typography for Zen Mode
  const zenClasses = zenMode 
    ? "text-xl md:text-2xl leading-loose max-w-3xl mx-auto" 
    : "text-base md:text-2xl font-medium text-center leading-relaxed text-gray-100";

  return (
    <div className={`flex flex-col items-center justify-center h-full mx-auto pb-10 px-4 md:px-6 transition-all duration-500 ${zenMode ? 'max-w-4xl' : 'max-w-2xl'}`}>
      {!zenMode && <div className="mb-4 md:mb-6 flex gap-1.5 md:gap-2">{cards.map((_, idx) => ( <div key={idx} className={`h-1 md:h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 md:w-8 bg-accent' : 'w-1.5 md:w-2 bg-gray-700'}`} /> ))}</div>}
      
      <div className={`w-full perspective-1000 mb-6 md:mb-10 cursor-pointer group ${zenMode ? 'aspect-[2/1] md:aspect-[3/1]' : 'aspect-[4/3] md:aspect-[3/2]'}`} onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-panel border border-gray-700/50 rounded-2xl md:rounded-3xl flex flex-col shadow-2xl overflow-hidden">
              <div className="h-1.5 md:h-2 w-full bg-accent/20"></div>
              <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8">
                <span className="text-[10px] md:text-xs font-bold text-accent tracking-[0.2em] uppercase mb-4">Topic</span>
                <h3 className={`${zenMode ? 'text-4xl md:text-6xl' : 'text-2xl md:text-5xl'} font-bold text-text text-center`}>{String(currentCard.term || '')}</h3>
             </div>
          </div>
          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-2xl md:rounded-3xl flex flex-col shadow-2xl border border-gray-600 overflow-hidden">
              <div className="bg-accent px-4 py-3 md:px-6 md:py-4 flex justify-between items-center"><h3 className="font-bold text-white text-base md:text-lg">{String(currentCard.term || '')}</h3></div>
              <div className="flex-1 flex items-center justify-center p-6 md:p-8 overflow-y-auto custom-scrollbar">
                 <div className={zenClasses}>
                    {applyAccessibilityTransforms(currentCard.definition, accessibilitySettings)}
                 </div>
              </div>
          </div>
        </div>
      </div>

      {!zenMode && (
        <div className="flex items-center gap-4 md:gap-6">
          <button onClick={prevCard} className="px-4 md:px-8 py-2.5 md:py-4 rounded-xl md:rounded-2xl bg-panel border border-gray-700/50 hover:bg-gray-700/50 text-text transition-all active:scale-95 text-xs md:text-base">Previous</button>
          <span className="text-sm md:text-xl font-mono text-text-muted w-16 md:w-20 text-center font-bold">{currentIndex + 1} / {cards.length}</span>
          <button onClick={nextCard} className="px-4 md:px-8 py-2.5 md:py-4 rounded-xl md:rounded-2xl bg-panel border border-gray-700/50 hover:bg-gray-700/50 text-text transition-all active:scale-95 text-xs md:text-base">Next</button>
        </div>
      )}
    </div>
  );
};

/* --- PREDICTIONS MODE --- */
const PredictionsMode: React.FC<{ predictions?: ExamPredictions }> = ({ predictions }) => {
    const { bionicReading, microChunking, syllableBreakdown, zenMode } = useAccessibility();
    const [secretRevealed, setSecretRevealed] = useState(false);
    const [mcqRevealed, setMcqRevealed] = useState(false);

    if (!predictions) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-text-muted p-6 text-center">
               <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin mb-4" />
               <p className="text-sm md:text-base">Consulting with Senior Examiners...</p>
            </div>
        );
    }

    const accessibilitySettings = { bionic: bionicReading, chunking: microChunking, syllables: syllableBreakdown };
    
    // Focused Typography for Zen Mode
    const zenTextClasses = zenMode 
        ? "text-xl md:text-2xl leading-loose max-w-3xl mx-auto" 
        : "leading-relaxed text-base md:text-lg";

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-4 md:p-10">
            <div className={`mx-auto space-y-6 md:space-y-8 animate-fadeIn transition-all duration-500 ${zenMode ? 'max-w-4xl' : 'max-w-4xl'}`}>
                {!zenMode && (
                    <div className="text-center mb-6 md:mb-10">
                        <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-3 mb-2">
                            <Shield className="text-purple-500 w-6 h-6 md:w-8 md:h-8" /> 
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Examiner's Confidential</span>
                        </h2>
                        <p className="text-[10px] md:text-sm text-text-muted uppercase tracking-widest border border-purple-500/30 inline-block px-3 py-1 rounded-full bg-purple-900/10">Top Secret • For Your Eyes Only</p>
                    </div>
                )}

                <div className={`bg-panel border border-red-500/30 rounded-2xl overflow-hidden shadow-2xl relative transition-all duration-500 ${zenMode ? 'border-none shadow-none bg-transparent' : ''}`}>
                    {!zenMode && <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] md:text-xs font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-bl-xl shadow-lg z-10">90% PROBABILITY</div>}
                    <div className={`p-5 md:p-8 ${!zenMode ? 'bg-gradient-to-br from-red-900/10 to-transparent' : ''}`}>
                        <div className={`flex items-start gap-3 md:gap-4 mb-4 ${zenMode ? 'justify-center text-center' : ''}`}>
                            {!zenMode && <div className="bg-red-500/20 p-2 md:p-3 rounded-lg text-red-400 shrink-0"><FileText size={20} /></div>}
                            <div className={zenMode ? 'w-full' : ''}>
                                {!zenMode && <h3 className="text-red-400 font-bold uppercase tracking-wider text-[10px] md:text-sm mb-1">5 Marks • High Probability</h3>}
                                <div className={`${zenMode ? 'text-3xl md:text-5xl mb-10' : 'text-lg md:text-2xl'} font-bold text-text leading-relaxed`}>
                                    {applyAccessibilityTransforms(predictions.longAnswer.question, { ...accessibilitySettings, chunking: false })}
                                </div>
                            </div>
                        </div>
                        <div className={`${!zenMode ? 'bg-black/20 rounded-xl p-4 md:p-5 border border-white/5' : ''} mb-6`}>
                            {!zenMode && <h4 className="text-xs font-bold text-text-muted uppercase mb-3">Model Answer Key</h4>}
                            <div className={`text-gray-300 ${zenTextClasses}`}>
                                {applyAccessibilityTransforms(predictions.longAnswer.modelAnswer, accessibilitySettings)}
                            </div>
                        </div>
                        {!zenMode && (
                          <>
                            <button onClick={() => setSecretRevealed(!secretRevealed)} className={`w-full py-3 md:py-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all group ${secretRevealed ? 'border-purple-500 bg-purple-500/10 text-purple-300' : 'border-gray-600 hover:border-gray-400 text-gray-400 hover:text-gray-200'}`}>
                                {secretRevealed ? <Unlock size={16} /> : <Lock size={16} />}
                                <span className="font-bold tracking-wider text-xs md:text-sm">{secretRevealed ? "EXAMINER SECRET REVEALED" : "TAP TO REVEAL EXAMINER SECRET"}</span>
                            </button>
                            {secretRevealed && (
                                <div className="mt-4 p-3 md:p-4 bg-purple-900/20 border-l-4 border-purple-500 rounded-r-xl animate-slideUp">
                                    <div className="text-purple-200 italic font-medium text-sm md:text-base">
                                        "{applyAccessibilityTransforms(predictions.longAnswer.examinerSecret, { ...accessibilitySettings, chunking: false })}"
                                    </div>
                                </div>
                            )}
                          </>
                        )}
                    </div>
                </div>

                {!zenMode && (
                  <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                      <div className="bg-panel border border-amber-500/30 rounded-2xl overflow-hidden shadow-lg flex flex-col">
                           <div className="bg-amber-900/20 p-3 md:p-4 border-b border-amber-500/20 flex items-center gap-2 md:gap-3"><AlertTriangle className="text-amber-500" size={18} /><h3 className="font-bold text-amber-500 uppercase tracking-wider text-[10px] md:text-sm">Student Trap (2 Marks)</h3></div>
                           <div className="p-5 md:p-6 flex-1 flex flex-col">
                               <div className="font-bold text-base md:text-lg mb-4 text-text">
                                  {applyAccessibilityTransforms(predictions.shortReasoning.question, { ...accessibilitySettings, chunking: false })}
                               </div>
                               <div className="flex-1 bg-black/20 rounded-lg p-3 md:p-4 mb-4 border border-white/5 text-sm md:text-base">
                                  <div className={`text-gray-300 ${zenTextClasses}`}>
                                      {applyAccessibilityTransforms(predictions.shortReasoning.answer, accessibilitySettings)}
                                  </div>
                               </div>
                               <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                                  <span className="text-[10px] font-bold text-amber-500 uppercase block mb-1">⚠️ Where students fail:</span>
                                  <div className="text-amber-200 text-xs md:text-sm">
                                      {applyAccessibilityTransforms(predictions.shortReasoning.studentTrap, { ...accessibilitySettings, chunking: false })}
                                  </div>
                               </div>
                           </div>
                      </div>
                      <div className="bg-panel border border-blue-500/30 rounded-2xl overflow-hidden shadow-lg flex flex-col">
                           <div className="bg-blue-900/20 p-3 md:p-4 border-b border-blue-500/20 flex items-center gap-2 md:gap-3"><Target className="text-blue-500" size={18} /><h3 className="font-bold text-blue-500 uppercase tracking-wider text-[10px] md:text-sm">Precision Check (MCQ)</h3></div>
                           <div className="p-5 md:p-6 flex-1 flex flex-col">
                               <div className="font-bold text-base md:text-lg mb-4 text-text">
                                  {applyAccessibilityTransforms(predictions.mcq.question, { ...accessibilitySettings, chunking: false })}
                                </div>
                               <div className="space-y-1.5 md:space-y-2 mb-4">
                                   {predictions.mcq.options.map((opt, i) => (
                                       <div key={i} className={`p-2 text-xs md:text-sm rounded border ${mcqRevealed && String(opt || '') === String(predictions.mcq.correct || '') ? 'bg-green-500/20 border-green-500 text-green-300' : 'bg-black/20 border-gray-700 text-gray-400'}`}>
                                            {applyAccessibilityTransforms(opt, { ...accessibilitySettings, chunking: false })} 
                                            {mcqRevealed && String(opt || '') === String(predictions.mcq.correct || '') && <CheckCircle size={12} className="inline ml-1.5"/>}
                                       </div>
                                   ))}
                               </div>
                               {!mcqRevealed ? ( <button onClick={() => setMcqRevealed(true)} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs md:text-sm transition-colors">Reveal Answer & Twist</button> ) : ( <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 animate-fadeIn"><span className="text-[10px] font-bold text-blue-400 uppercase block mb-1">🎯 The Twist:</span><div className="text-blue-200 text-xs md:text-sm">{applyAccessibilityTransforms(predictions.mcq.twist, { ...accessibilitySettings, chunking: false })}</div></div> )}
                           </div>
                      </div>
                  </div>
                )}
            </div>
        </div>
    );
};

export default KnowledgeDisplay;

// // components/KnowledgeDisplay.tsx
// import React, { useState, useEffect, useRef, useMemo } from 'react';
// import { 
//   BookOpen, HelpCircle, Network, Zap, Volume2, RotateCw, StickyNote, 
//   CheckCircle, XCircle, Info, Play, Pause, Square, PenTool, Award, 
//   ArrowRight, RotateCcw, Highlighter, Shield, FileText, AlertTriangle, 
//   Target, Lock, Unlock, Loader2, Sparkles, Brain, Swords, ChevronRight, 
//   MessageSquareDashed, Headphones
// } from 'lucide-react';
// import confetti from 'canvas-confetti';
// import { AnalysisResult, TabType, QuizQuestion, MindMapNode, ExamPredictions, Flashcard } from '../types';
// import { useAccessibility } from '../contexts/AccessibilityContext';
// import { useAudio } from '../contexts/AudioContext';
// import { useSettings } from '../contexts/SettingsContext';
// import { useProgress } from '../contexts/ProgressContext';
// import { generateHint, expandMindMapNode } from '../services/geminiService'; 
// import DebateMode from './DebateMode';

// /**
//  * Universal Accessibility Text Transformer
//  */
// const applyAccessibilityTransforms = (text: any, settings: { bionic: boolean; chunking: boolean; syllables: boolean }) => {
//     const { bionic, chunking, syllables } = settings;
//     const safeText = String(text || '');

//     const transformWord = (word: string) => {
//         let processed = word;
//         if (syllables && word.length > 3) {
//             processed = processed.replace(/([aeiouy]{1,2}[^aeiouy]{0,2})/gi, '$1·').replace(/·$/, '');
//         }
//         if (bionic) {
//             const splitIndex = Math.ceil(processed.length / 2);
//             const boldPart = processed.slice(0, splitIndex);
//             const restPart = processed.slice(splitIndex);
//             return <React.Fragment key={word + "_bionic"}><b className="font-bold">{boldPart}</b>{restPart}</React.Fragment>;
//         }
//         return processed;
//     };

//     const processSentence = (sentence: string) => {
//         const words = sentence.split(/(\s+)/);
//         return words.map((part, i) => {
//             if (/\s+/.test(part)) return part;
//             return <React.Fragment key={i}>{transformWord(part)}</React.Fragment>;
//         });
//     };

//     if (chunking) {
//         const sentences = safeText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
//         return (
//             <ul className="space-y-3 my-4">
//                 {sentences.map((sent, i) => (
//                     <li key={i} className="flex gap-3 items-start group">
//                         <span className="text-accent mt-1.5 shrink-0 transition-transform group-hover:scale-125">•</span>
//                         <span className="leading-relaxed">{processSentence(sent)}</span>
//                     </li>
//                 ))}
//             </ul>
//         );
//     }

//     return safeText.split('\n').map((para, i) => (
//         <span key={i} className="block mb-4 leading-relaxed">
//             {processSentence(para)}
//         </span>
//     ));
// };

// /**
//  * Story Mode with Karaoke Highlighting and Visual Mnemonics
//  */
// const StoryMode: React.FC<{ story: any }> = ({ story }) => {
//   const { isPlaying, togglePlay, stop, speed, setSpeed, currentCharIndex, playText } = useAudio();
//   const { bionicReading, microChunking, syllableBreakdown, bgTint, lineSpacing, zenMode } = useAccessibility();
//   const [isHighlighterActive, setIsHighlighterActive] = useState(false);
//   const storyRef = useRef<HTMLDivElement>(null);

//   const narrative = story?.narrative || "";
//   const sentences = useMemo(() => narrative.split(/(?<=[.!?])\s+/), [narrative]);

//   const themeStyles = (() => {
//     switch (bgTint) {
//       case 'sepia': return { bg: 'bg-[#F5E6D3]', text: 'text-gray-900' };
//       case 'blue': return { bg: 'bg-[#E0F7FA]', text: 'text-gray-900' };
//       case 'black': return { bg: 'bg-black border-gray-800', text: 'text-white' };
//       default: return { bg: 'bg-panel/50', text: 'text-text' };
//     }
//   })();

//   const handleListen = () => {
//     if (isPlaying) stop();
//     else playText(narrative);
//   };

//   const handleTextSelection = () => {
//     if (!isHighlighterActive) return;
//     const sel = window.getSelection();
//     if (!sel || sel.rangeCount === 0 || sel.toString().trim() === "") return;
//     const range = sel.getRangeAt(0);
//     const span = document.createElement('span');
//     span.className = 'user-highlight';
//     span.onclick = (e) => { (e.target as HTMLElement).replaceWith(...(e.target as HTMLElement).childNodes); };
//     try {
//       range.surroundContents(span);
//       sel.removeAllRanges();
//     } catch (e) { console.warn("Complex selection highlighting not supported"); }
//   };

//   const renderKaraokeText = () => {
//     let cumulativeLength = 0;
//     return sentences.map((sent, idx) => {
//       const start = cumulativeLength;
//       const end = cumulativeLength + sent.length;
//       cumulativeLength += sent.length + 1; // +1 for the space split
//       const isActive = currentCharIndex >= start && currentCharIndex <= end && isPlaying;

//       return (
//         <span 
//           key={idx} 
//           className={`transition-all duration-300 rounded px-1 ${
//             isActive ? 'bg-yellow-200/80 text-gray-900 dark:bg-teal-900/60 dark:text-teal-100' : ''
//           }`}
//         >
//           {applyAccessibilityTransforms(sent, { bionic: bionicReading, chunking: microChunking, syllables: syllableBreakdown })}
//         </span>
//       );
//     });
//   };

//   return (
//     <div className={`flex flex-col h-full animate-fadeIn transition-all duration-500 ${zenMode ? 'zen-active' : ''}`}>
//       {/* Audio Toolbar */}
//       <div className={`flex items-center justify-between px-6 py-3 border-b border-gray-700/50 bg-panel/80 backdrop-blur-md sticky top-0 z-10 ${zenMode ? 'opacity-0 h-0 p-0 overflow-hidden' : ''}`}>
//         <div className="flex items-center gap-4">
//           <button onClick={handleListen} className="p-2 bg-accent text-white rounded-full hover:bg-accent-hover transition-all active:scale-95 shadow-lg">
//             {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
//           </button>
//           <div className="flex flex-col">
//             <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Reader Controls</span>
//             <div className="flex items-center gap-3">
//               <button 
//                 onClick={() => setSpeed(Math.max(0.5, speed - 0.25))}
//                 className="text-text-muted hover:text-text transition-colors"
//               >
//                 -
//               </button>
//               <span className="text-xs font-mono text-white min-w-[30px] text-center">{speed}x</span>
//               <button 
//                 onClick={() => setSpeed(Math.min(2, speed + 0.25))}
//                 className="text-text-muted hover:text-text transition-colors"
//               >
//                 +
//               </button>
//             </div>
//           </div>
//         </div>
//         <div className="flex items-center gap-3">
//            <button 
//              onClick={() => setIsHighlighterActive(!isHighlighterActive)}
//              className={`p-2 rounded-lg border transition-all ${isHighlighterActive ? 'bg-yellow-400 border-yellow-500 text-black shadow-inner' : 'bg-gray-800 border-gray-700 text-text-muted hover:text-white'}`}
//              title="Visual Highlighter Tool"
//            >
//              <Highlighter size={18} />
//            </button>
//         </div>
//       </div>

//       <div className={`flex-1 overflow-y-auto p-8 custom-scrollbar ${zenMode ? 'bg-black' : ''}`}>
//         <div 
//           ref={storyRef}
//           onMouseUp={handleTextSelection}
//           className={`max-w-3xl mx-auto rounded-3xl p-8 md:p-12 shadow-xl transition-all duration-500 ${themeStyles.bg} ${themeStyles.text} ${zenMode ? 'text-xl md:text-2xl leading-loose max-w-3xl border-none shadow-none bg-transparent' : ''}`}
//           style={{ lineHeight: zenMode ? '2' : lineSpacing }}
//         >
//           {/* Header */}
//           <div className="mb-10 text-center">
//              <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight leading-tight">{story.title}</h2>
//              <div className="h-1.5 w-24 bg-accent mx-auto rounded-full" />
//           </div>

//           {/* Visual Mnemonic Section */}
//           {story.visualVibe?.svg_code && (
//             <div className="mb-12 bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col items-center animate-fadeIn">
//                <div 
//                 className="w-full max-w-lg mb-4 svg-container stroke-accent" 
//                 dangerouslySetInnerHTML={{ __html: story.visualVibe.svg_code }}
//                />
//                <p className="text-sm italic opacity-60 text-center">{story.visualVibe.caption}</p>
//             </div>
//           )}

//           {/* Cheat Sheet (Sticky Note Style) */}
//           <div className="mb-12 bg-yellow-400/10 border-l-4 border-yellow-400 p-6 rounded-r-2xl animate-slideUp">
//              <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-yellow-500">
//                <StickyNote size={20} /> The Exam Cheat Sheet
//              </h3>
//              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                {story.cheatSheet.map((item: string, i: number) => (
//                  <li key={i} className="flex items-start gap-2 text-sm">
//                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 shrink-0" />
//                    {item}
//                  </li>
//                ))}
//              </ul>
//           </div>

//           {/* Narrative Text */}
//           <div className="prose prose-lg dark:prose-invert max-w-none">
//              {renderKaraokeText()}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// /**
//  * Gamified Question Card Component
//  */
// const GamifiedQuestionCard: React.FC<{
//   question: QuizQuestion;
//   index: number;
//   onAnswer: (correct: boolean, category: string) => void;
// }> = ({ question, index, onAnswer }) => {
//   const [selected, setSelected] = useState<string | null>(null);
//   const [showHint, setShowHint] = useState(false);
//   const [hintText, setHintText] = useState<string | null>(null);
//   const [loadingHint, setLoadingHint] = useState(false);
//   const [isLocked, setIsLocked] = useState(false);
//   const { apiKey } = useSettings();

//   const handleSelect = async (opt: string) => {
//     if (isLocked) return;
//     setSelected(opt);
//     const isCorrect = opt === question.correctAnswer;
    
//     if (isCorrect) {
//       setIsLocked(true);
//       onAnswer(true, question.type);
//       try { new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3').play(); } catch(e) {}
//     } else {
//       onAnswer(false, question.type);
//       try { new Audio('https://assets.mixkit.co/active_storage/sfx/2882/2882-preview.mp3').play(); } catch(e) {}
//     }
//   };

//   const fetchHint = async () => {
//     if (isLocked || loadingHint) return;
//     setLoadingHint(true);
//     try {
//       const hint = await generateHint(question.question, selected || "", question.correctAnswer, "Study Topic", apiKey);
//       setHintText(hint);
//       setShowHint(true);
//     } catch (e) {
//       setHintText(question.socraticHint);
//       setShowHint(true);
//     } finally {
//       setLoadingHint(false);
//     }
//   };

//   return (
//     <div className="bg-panel border border-gray-700 rounded-3xl p-6 mb-6 shadow-lg animate-fadeIn hover:border-accent/50 transition-colors">
//       <div className="flex justify-between items-start mb-4">
//         <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-accent/20">
//           {question.type}
//         </span>
//         <span className="text-text-muted text-xs font-bold">Q{index + 1}</span>
//       </div>
      
//       <h3 className="text-lg font-bold text-white mb-6 leading-relaxed">{question.question}</h3>
      
//       <div className="space-y-3">
//         {question.options.map((opt, i) => {
//           const isCorrect = opt === question.correctAnswer;
//           const isSelected = selected === opt;
          
//           let btnClass = "bg-gray-800 border-gray-700 hover:border-accent/50 text-gray-300";
//           if (isSelected) {
//             btnClass = isCorrect ? "bg-green-500/20 border-green-500 text-green-400" : "bg-red-500/20 border-red-500 text-red-400";
//           } else if (isLocked && isCorrect) {
//             btnClass = "bg-green-500/10 border-green-500/50 text-green-400";
//           }

//           return (
//             <button
//               key={i}
//               onClick={() => handleSelect(opt)}
//               disabled={isLocked}
//               className={`w-full p-4 rounded-2xl text-left text-sm font-medium transition-all flex items-center justify-between group border-2 ${btnClass}`}
//             >
//               <span>{opt}</span>
//               {isSelected && (isCorrect ? <CheckCircle size={18} /> : <XCircle size={18} />)}
//             </button>
//           );
//         })}
//       </div>

//       {!isLocked && selected && selected !== question.correctAnswer && (
//         <div className="mt-4 animate-slideUp">
//           <button 
//             onClick={fetchHint}
//             className="flex items-center gap-2 text-yellow-500 text-sm font-bold hover:underline"
//           >
//             {loadingHint ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
//             Ask Socratic Tutor for a hint...
//           </button>
//           {showHint && (
//             <div className="mt-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-sm text-yellow-200 flex gap-3">
//               <Info className="shrink-0 mt-0.5 text-yellow-500" size={18} />
//               <p className="italic">{hintText}</p>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// /**
//  * Quiz Mode with Scrollable List and Results
//  */
// const QuizMode: React.FC<{ questions: QuizQuestion[] }> = ({ questions }) => {
//   const [results, setResults] = useState<Record<number, boolean>>({});
//   const [firstAttempts, setFirstAttempts] = useState<Record<number, boolean>>({});
//   const [showResults, setShowResults] = useState(false);
//   const { setScore: setGlobalScore, setTotalQuestions, setWeakestCategory } = useProgress();

//   useEffect(() => {
//     setTotalQuestions(questions.length);
//   }, [questions]);

//   const onAnswer = (id: number, correct: boolean, category: string) => {
//     if (results[id] !== undefined) return;
    
//     setResults(prev => ({ ...prev, [id]: correct }));
//     setFirstAttempts(prev => ({ ...prev, [id]: correct }));
    
//     if (Object.keys(results).length + 1 === questions.length) {
//       setShowResults(true);
//     }

//     if (!correct) {
//       setWeakestCategory(category);
//     }
//   };

//   const score = Object.values(firstAttempts).filter(v => v).length;

//   useEffect(() => {
//     if (showResults) {
//       setGlobalScore(score);
//       if (score === questions.length) {
//         confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
//         try { new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3').play(); } catch(e) {}
//       } else {
//         try { new Audio('https://assets.mixkit.co/active_storage/sfx/2882/2882-preview.mp3').play(); } catch(e) {}
//       }
//     }
//   }, [showResults]);

//   const resetQuiz = () => {
//     setResults({});
//     setFirstAttempts({});
//     setShowResults(false);
//     alert("Simulation: Fetching new questions...");
//   };

//   return (
//     <div className="h-full overflow-y-auto p-6 md:p-12 custom-scrollbar animate-fadeIn">
//       <div className="max-w-2xl mx-auto">
//         <div className="mb-10 text-center">
//            <h2 className="text-3xl font-black text-white mb-2">Quiz Mode</h2>
//            <p className="text-text-muted">Master the concept by hunting your blind spots.</p>
//         </div>

//         {questions.map((q, idx) => (
//           <GamifiedQuestionCard 
//             key={q.id} 
//             question={q} 
//             index={idx} 
//             onAnswer={(correct, cat) => onAnswer(q.id, correct, cat)} 
//           />
//         ))}

//         {showResults && (
//           <div className="mt-12 bg-panel border-4 border-accent rounded-3xl p-8 shadow-2xl animate-slideUp text-center relative overflow-hidden">
//             <div className="absolute top-0 left-0 w-full h-2 bg-accent" />
//             <Award className="mx-auto text-accent mb-4" size={64} />
//             <h3 className="text-3xl font-black text-white mb-2">
//               {score === questions.length ? "EXAM READY! 🌟" : "KEEP PUSHING! 📈"}
//             </h3>
//             <p className="text-4xl font-black text-accent mb-6">{score} / {questions.length}</p>
            
//             <div className="flex flex-col md:flex-row gap-4 justify-center">
//               <button onClick={() => window.location.reload()} className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition-all">
//                 <RotateCcw size={20} /> Retry Current
//               </button>
//               <button onClick={resetQuiz} className="flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-hover transition-all shadow-lg shadow-accent/20">
//                 <RotateCw size={20} /> Load New Quiz
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// /**
//  * Radial Mind Map Visualization
//  */
// const MindMapMode: React.FC<{ rootTopic: string; initialNodes: MindMapNode[] }> = ({ rootTopic, initialNodes }) => {
//   const [nodes, setNodes] = useState(initialNodes);
//   const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
//   const { useMockMode, apiKey } = useSettings();
//   const [isExpanding, setIsExpanding] = useState(false);

//   useEffect(() => {
//     // Default select root
//     setSelectedNode({ id: 'root', label: rootTopic, description: 'The main central concept of this study module.' });
//   }, [rootTopic]);

//   const handleNodeClick = async (node: MindMapNode) => {
//     setSelectedNode(node);
//     if (node.id === 'root') return;
    
//     setIsExpanding(true);
//     try {
//       const children = await expandMindMapNode(rootTopic, node.label, node.id, useMockMode, apiKey);
//       if (children.length > 0) {
//         setNodes(prev => [...prev, ...children.filter(c => !prev.find(p => p.id === c.id))]);
//       }
//     } catch (e) { console.error("Expansion failed"); }
//     finally { setIsExpanding(false); }
//   };

//   const renderVisuals = () => {
//     const rootNodes = nodes.filter(n => n.parentId === 'root');
//     const radius = 160;
//     const centerX = 250;
//     const centerY = 200;

//     return (
//       <svg viewBox="0 0 500 450" className="w-full h-full drop-shadow-2xl">
//         {/* Connections */}
//         {rootNodes.map((n, i) => {
//           const angle = (i / rootNodes.length) * 2 * Math.PI;
//           const x = centerX + radius * Math.cos(angle);
//           const y = centerY + radius * Math.sin(angle);
//           return (
//             <line key={`line-${i}`} x1={centerX} y1={centerY} x2={x} y2={y} stroke="var(--accent-color)" strokeWidth="2" strokeOpacity="0.3" strokeDasharray="5,5" />
//           );
//         })}

//         {/* Root Node */}
//         <g className="cursor-pointer group" onClick={() => handleNodeClick({ id: 'root', label: rootTopic, description: 'Root concept summary.' })}>
//           <circle cx={centerX} cy={centerY} r="50" className="fill-accent animate-pulse-glow" />
//           <text x={centerX} y={centerY + 5} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" className="pointer-events-none uppercase tracking-tighter">
//             {rootTopic.length > 15 ? rootTopic.substring(0, 12) + '...' : rootTopic}
//           </text>
//         </g>

//         {/* Branch Nodes */}
//         {rootNodes.map((n, i) => {
//           const angle = (i / rootNodes.length) * 2 * Math.PI;
//           const x = centerX + radius * Math.cos(angle);
//           const y = centerY + radius * Math.sin(angle);
//           const isSelected = selectedNode?.id === n.id;

//           return (
//             <g key={n.id} className="cursor-pointer group" onClick={() => handleNodeClick(n)}>
//               <circle 
//                 cx={x} cy={y} r="35" 
//                 className={`transition-all duration-300 ${isSelected ? 'fill-accent scale-110' : 'fill-panel stroke-accent stroke-2 hover:fill-accent/10'}`} 
//               />
//               <text x={x} y={y + 5} textAnchor="middle" fill={isSelected ? "white" : "var(--text-color)"} fontSize="9" fontWeight="bold" className="pointer-events-none uppercase">
//                 {n.label.length > 10 ? n.label.substring(0, 8) + '..' : n.label}
//               </text>
//             </g>
//           );
//         })}
//       </svg>
//     );
//   };

//   return (
//     <div className="flex flex-col h-full bg-black/10 animate-fadeIn">
//       <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
//         {isExpanding && (
//            <div className="absolute top-10 left-10 flex items-center gap-2 px-4 py-2 bg-accent/20 border border-accent rounded-full animate-pulse z-20">
//               <Loader2 className="animate-spin text-accent" size={16} />
//               <span className="text-xs font-bold text-accent">AI Expanding Map...</span>
//            </div>
//         )}
//         {renderVisuals()}
//       </div>

//       <div className="h-52 md:h-64 bg-panel border-t border-gray-700/50 p-6 md:p-8 animate-slideUp shrink-0">
//         <div className="max-w-3xl mx-auto">
//           {selectedNode ? (
//             <div className="animate-fadeIn">
//                <h3 className="text-xl md:text-2xl font-black text-accent mb-3 uppercase tracking-tight">{selectedNode.label}</h3>
//                <p className="text-sm md:text-base text-text-muted leading-relaxed">
//                  {selectedNode.description || "No detailed description available for this specific concept."}
//                </p>
//             </div>
//           ) : (
//             <div className="flex flex-col items-center justify-center h-full opacity-30 italic">
//                <Network size={32} className="mb-2" />
//                <p>Select a node to view the deep-dive analysis</p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// /**
//  * Flashcard Mode Component
//  */
// const FlashcardMode: React.FC<{ cards: Flashcard[] }> = ({ cards }) => {
//   const [index, setIndex] = useState(0);
//   const [flipped, setFlipped] = useState(false);
//   const { bionicReading, microChunking, syllableBreakdown } = useAccessibility();

//   const handleNext = () => { setFlipped(false); setIndex((index + 1) % cards.length); };
//   const handlePrev = () => { setFlipped(false); setIndex((index - 1 + cards.length) % cards.length); };

//   const current = cards[index];

//   return (
//     <div className="p-6 h-full flex flex-col items-center justify-center animate-fadeIn">
//       <div 
//         className="w-full max-w-lg aspect-[1.618/1] relative cursor-pointer perspective-1000 group"
//         onClick={() => setFlipped(!flipped)}
//       >
//         <div className={`w-full h-full relative transition-transform duration-700 preserve-3d ${flipped ? 'rotate-y-180' : ''}`}>
//           {/* Front */}
//           <div className="absolute inset-0 backface-hidden bg-panel border-2 border-accent/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl group-hover:border-accent transition-all">
//              <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-4">Topic</span>
//              <h3 className="text-3xl font-black text-white leading-tight">{current.term}</h3>
//              <div className="mt-8 flex items-center gap-2 text-text-muted text-xs font-bold uppercase">
//                 <RotateCw size={14} /> Click to Flip
//              </div>
//           </div>
//           {/* Back */}
//           <div className="absolute inset-0 backface-hidden rotate-y-180 bg-accent text-white rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl">
//              <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-4">Mastery Definition</span>
//              <p className="text-xl font-bold leading-relaxed">
//                {applyAccessibilityTransforms(current.definition, { bionic: bionicReading, chunking: microChunking, syllables: syllableBreakdown })}
//              </p>
//           </div>
//         </div>
//       </div>

//       <div className="flex items-center gap-8 mt-12">
//          <button onClick={handlePrev} className="p-4 rounded-full bg-gray-800 text-text-muted hover:text-white transition-all hover:scale-110 active:scale-90"><ArrowRight className="rotate-180" size={24} /></button>
//          <span className="text-lg font-black font-mono text-accent">{index + 1} / {cards.length}</span>
//          <button onClick={handleNext} className="p-4 rounded-full bg-gray-800 text-text-muted hover:text-white transition-all hover:scale-110 active:scale-90"><ArrowRight size={24} /></button>
//       </div>
//     </div>
//   );
// };

// /**
//  * Predictions (Exam Leak) Mode Component
//  */
// const PredictionsMode: React.FC<{ predictions?: ExamPredictions }> = ({ predictions }) => {
//   const { bionicReading, microChunking, syllableBreakdown } = useAccessibility();
//   if (!predictions) return <div className="p-12 text-center text-text-muted italic">No exam predictions available for this topic.</div>;

//   return (
//     <div className="p-6 md:p-12 h-full overflow-y-auto animate-fadeIn custom-scrollbar">
//       <div className="max-w-4xl mx-auto space-y-10 pb-12">
//         <div className="text-center">
//            <h2 className="text-3xl font-black text-white flex items-center justify-center gap-3">
//              <Sparkles className="text-purple-400" /> Exam Leak Prediction
//            </h2>
//            <p className="text-text-muted mt-2">Predicted based on 20-year board analysis.</p>
//         </div>

//         <div className="space-y-8">
//           <Section icon={<FileText className="text-blue-400" />} label="Predicted Long Answer (5 Marks)" title={predictions.longAnswer.question}>
//             <div className="mt-6 p-6 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-xl">
//                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-2">Model Answer Strategy</span>
//                <div className="text-sm md:text-base leading-relaxed">
//                   {applyAccessibilityTransforms(predictions.longAnswer.modelAnswer, { bionic: bionicReading, chunking: microChunking, syllables: syllableBreakdown })}
//                </div>
//             </div>
//             <div className="mt-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl flex gap-3">
//                <Lock size={18} className="text-purple-400 shrink-0 mt-1" />
//                <p className="text-xs italic text-purple-300">"Examiner's Secret: {predictions.longAnswer.examinerSecret}"</p>
//             </div>
//           </Section>

//           <Section icon={<HelpCircle className="text-amber-400" />} label="Tricky Reasoning (2 Marks)" title={predictions.shortReasoning.question}>
//             <div className="mt-6 p-6 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-xl">
//                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-2">Target Logic</span>
//                <div className="text-sm md:text-base">
//                   {applyAccessibilityTransforms(predictions.shortReasoning.answer, { bionic: bionicReading, chunking: microChunking, syllables: syllableBreakdown })}
//                </div>
//             </div>
//             <div className="mt-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex gap-3">
//                <AlertTriangle size={18} className="text-red-400 shrink-0 mt-1" />
//                <p className="text-xs italic text-red-300">"Student Trap: {predictions.shortReasoning.studentTrap}"</p>
//             </div>
//           </Section>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Section: React.FC<{ icon: any, label: string, title: string, children: any }> = ({ icon, label, title, children }) => (
//   <div className="bg-panel/80 border border-gray-700/50 rounded-3xl p-8 shadow-xl">
//      <div className="flex items-center gap-3 mb-4">
//         {icon} <span className="text-xs font-black uppercase tracking-widest text-text-muted">{label}</span>
//      </div>
//      <h3 className="text-xl md:text-2xl font-black text-white leading-tight">{title}</h3>
//      {children}
//   </div>
// );

// /**
//  * Main Knowledge Display Logic
//  */
// interface KnowledgeDisplayProps {
//   data: AnalysisResult | null;
//   isProcessing: boolean;
// }

// const KnowledgeDisplay: React.FC<KnowledgeDisplayProps> = ({ data, isProcessing }) => {
//   const [activeTab, setActiveTab] = useState<TabType>('story');
//   const { setTopic } = useProgress();

//   useEffect(() => {
//     if (data?.mindMap?.root) {
//       setTopic(data.mindMap.root);
//     }
//   }, [data, setTopic]);

//   const renderContent = () => {
//     if (isProcessing) {
//       return (
//         <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-pulse-glow">
//           <div className="w-24 h-24 bg-panel rounded-full flex items-center justify-center mb-6 shadow-2xl">
//             <Loader2 className="w-12 h-12 text-accent animate-spin" />
//           </div>
//           <h2 className="text-2xl font-black mb-2 tracking-tight">AI is Mapping Concepts...</h2>
//           <p className="text-text-muted max-w-sm">Crafting stories, predicting exam questions, and drawing visual vibe SVGs.</p>
//         </div>
//       );
//     }

//     if (!data) {
//       return (
//         <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40">
//            <BookOpen size={64} className="text-gray-600 mb-6" />
//            <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter">Companion Ready</h2>
//            <p className="text-text-muted max-w-xs">Upload a file or image to start your multimodal study journey.</p>
//         </div>
//       );
//     }

//     switch (activeTab) {
//       case 'story': return <StoryMode story={data.story} />;
//       case 'quiz': return <QuizMode questions={data.quiz} />;
//       case 'mindmap': return <MindMapMode rootTopic={data.mindMap.root} initialNodes={data.mindMap.nodes} />;
//       case 'flashcards': return <FlashcardMode cards={data.flashcards} />;
//       case 'examleak': return <PredictionsMode predictions={data.examPredictions} />;
//       case 'debate': return <DebateMode topic={data.mindMap?.root || "Selected Topic"} />;
//       default: return null;
//     }
//   };

//   return (
//     <div className="h-full flex flex-col bg-panel/30">
//       <div className="flex items-center px-4 md:px-6 pt-2 md:pt-4 border-b border-gray-700/50 bg-panel overflow-x-auto no-scrollbar shrink-0 z-20">
//         <TabButton active={activeTab === 'story'} onClick={() => setActiveTab('story')} icon={<BookOpen size={18} />} label="Story Mode" />
//         <TabButton active={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')} icon={<HelpCircle size={18} />} label="Quiz Mode" />
//         <TabButton active={activeTab === 'mindmap'} onClick={() => setActiveTab('mindmap')} icon={<Network size={18} />} label="Mind Map" />
//         <TabButton active={activeTab === 'flashcards'} onClick={() => setActiveTab('flashcards')} icon={<Zap size={18} />} label="Flashcards" />
//         <TabButton active={activeTab === 'debate'} onClick={() => setActiveTab('debate')} icon={<Swords size={18} />} label="Debate Dojo" />
//         <TabButton active={activeTab === 'examleak'} onClick={() => setActiveTab('examleak')} icon={<Sparkles size={18} className="text-purple-400" />} label="Exam Leak" isSpecial />
//       </div>

//       <div className="flex-1 overflow-hidden">
//         {renderContent()}
//       </div>
//     </div>
//   );
// };

// const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: any; label: string; isSpecial?: boolean }> = ({ active, onClick, icon, label, isSpecial }) => (
//   <button
//     onClick={onClick}
//     className={`flex items-center gap-2 px-6 py-4 font-bold text-xs md:text-sm transition-all border-b-2 whitespace-nowrap ${
//       active
//         ? isSpecial ? 'border-purple-500 text-purple-400 bg-purple-500/10' : 'border-accent text-accent'
//         : 'border-transparent text-text-muted hover:text-text hover:bg-gray-800/20'
//     }`}
//   >
//     {icon}
//     {label}
//   </button>
// );

// export default KnowledgeDisplay;
