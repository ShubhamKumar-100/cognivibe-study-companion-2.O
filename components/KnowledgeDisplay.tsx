
// components/KnowledgeDisplay.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, HelpCircle, Network, Zap, Volume2, RotateCw, StickyNote, 
  CheckCircle, XCircle, Info, Play, Pause, Square, PenTool, Award, 
  ArrowRight, RotateCcw, Highlighter, Shield, FileText, AlertTriangle, 
  Target, Lock, Unlock, Loader2, Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AnalysisResult, TabType, QuizQuestion, MindMapNode, ExamPredictions, Flashcard } from '../types';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useAudio } from '../contexts/AudioContext';
import { useSettings } from '../contexts/SettingsContext';
import { generateHint, expandMindMapNode } from '../services/geminiService'; 

interface KnowledgeDisplayProps {
  data: AnalysisResult | null;
  isProcessing: boolean;
}

/**
 * Global helper for applying accessibility transforms safely to any text
 */
const applyAccessibilityTransforms = (text: any, bionic: boolean, chunking: boolean) => {
    const safeText = String(text || '');
    
    const applyBionic = (t: string) => {
        if (!bionic) return t;
        const words = t.split(' ');
        return words.map((word, i) => {
            const safeWord = String(word || '');
            const split = Math.ceil(safeWord.length / 2);
            return (
                <React.Fragment key={i}>
                    <b className="font-bold">{safeWord.slice(0, split)}</b>{safeWord.slice(split)}{i === words.length - 1 ? '' : ' '}
                </React.Fragment>
            );
        });
    };

    if (chunking) {
        const chunks = safeText.split(/[.!?]+/).filter(c => c.trim().length > 0);
        return (
            <ul className="space-y-2">
                {chunks.map((chunk, i) => (
                    <li key={i} className="flex gap-2 items-start">
                        <span className="text-accent mt-1.5">•</span>
                        <span className="leading-relaxed">{applyBionic(String(chunk || '').trim() + ".")}</span>
                    </li>
                ))}
            </ul>
        );
    }

    return applyBionic(safeText);
};

const KnowledgeDisplay: React.FC<KnowledgeDisplayProps> = ({ data, isProcessing }) => {
  const [activeTab, setActiveTab] = useState<TabType>('story');

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
        return <QuizMode questions={data.quiz} />;
      case 'mindmap':
        return <MindMapMode 
                  rootTopic={data.mindMap?.root || "Concept Map"} 
                  initialNodes={data.mindMap?.nodes || []} 
               />;
      case 'flashcards':
        return <FlashcardMode cards={data.flashcards} />;
      case 'examleak':
        return <PredictionsMode predictions={data.examPredictions} />;
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
    const narrativeText = String(story || '');
    const paragraphs = narrativeText.split('\n').filter(p => p.trim());
    let cumulativeCharCount = 0;
    const textClasses = zenMode 
        ? "text-lg md:text-2xl leading-loose max-w-3xl mx-auto" 
        : "prose prose-sm md:prose-lg max-w-none";

    return (
      <div 
        className={textClasses} 
        style={{ lineHeight: zenMode ? '2' : String(lineSpacing) }}
        onMouseUp={handleTextSelection}
        onClick={handleHighlightClick}
      >
        {paragraphs.map((paragraph, pIdx) => {
          const safePara = String(paragraph || '');
          const sentences = safePara.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [safePara];
          return (
            <p key={pIdx} className="mb-4 md:mb-6 relative">
              {sentences.map((sentence, sIdx) => {
                const startIndex = cumulativeCharCount;
                const safeSentence = String(sentence || '');
                const endIndex = startIndex + safeSentence.length;
                cumulativeCharCount += safeSentence.length;
                if (sIdx === sentences.length - 1) cumulativeCharCount += 1; 
                
                const isActive = isPlaying && String(audioText || '') === safeStory && (currentCharIndex >= startIndex && currentCharIndex < endIndex + 2);
                
                let displaySentence = safeSentence;
                if (syllableBreakdown) {
                    displaySentence = displaySentence.split(' ').map(w => w.length > 4 ? w.replace(/(.{3})/g, '$1·').replace(/·$/, '') : w).join(' ');
                }
                
                return (
                  <span 
                    key={sIdx}
                    className={`transition-colors duration-300 rounded px-0.5 ${
                        isActive 
                        ? 'bg-yellow-200 text-gray-900 box-decoration-clone dark:bg-teal-800 dark:text-white shadow-sm font-medium' 
                        : ''
                    }`}
                  >
                    {applyAccessibilityTransforms(displaySentence, bionicReading, false)}
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
                <div className="flex flex-col ml-1 hidden sm:flex">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Now Playing</span>
                    <span className={`text-xs md:text-sm font-medium truncate max-w-[150px] md:max-w-[200px] ${themeStyles.text}`}>
                        {isPlaying ? "Karaoke Read-Along Active" : "Interactive Story Narration"}
                    </span>
                </div>
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
                    <span>{String(point || '')}</span>
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
              {microChunking ? (
                  <ul className={`space-y-4 md:space-y-6 ${zenMode ? 'max-w-3xl mx-auto' : ''}`}>
                     {safeStory.match(/[^.!?]+[.!?]+/g)?.map((sent, idx) => (
                         <li key={idx} className="flex gap-3 md:gap-4 bg-black/5 p-3 md:p-4 rounded-xl border border-gray-700/10 items-start">
                         <span className="text-accent mt-2 text-lg md:text-xl">•</span>
                         <span style={{ lineHeight: zenMode ? '2' : String(lineSpacing) }} className={zenMode ? 'text-lg md:text-xl' : 'text-sm md:text-base'}>{String(sent || '')}</span>
                         </li>
                     ))}
                  </ul>
              ) : (
                renderKaraokeText()
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- QUIZ MODE --- */
const QuizMode: React.FC<{ questions: QuizQuestion[] }> = ({ questions }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);

    useEffect(() => { 
        setCurrentIndex(0); 
        setScore(0); 
        setShowResult(false); 
    }, [questions]);
    
    const handleAnswer = (isCorrect: boolean) => { 
        if (isCorrect) {
          setScore(s => s + 1);
          new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3').play().catch(() => {});
        } else {
          new Audio('https://assets.mixkit.co/active_storage/sfx/2882/2882-preview.mp3').play().catch(() => {});
        }
    };
    
    const handleNext = () => { 
      if (currentIndex < questions.length - 1) { 
        setCurrentIndex(prev => prev + 1); 
      } else { 
        setShowResult(true); 
      } 
    };

    const handleLoadNewQuiz = () => {
        setCurrentIndex(0); 
        setScore(0); 
        setShowResult(false);
        alert("Fetching new questions... (Simulation)"); 
    };

    useEffect(() => {
        if (showResult) {
            if (score === questions.length) {
              const masteryAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
              masteryAudio.play().catch(e => console.warn("Victory audio blocked:", e));
              
              confetti({ 
                particleCount: 150, 
                spread: 70, 
                origin: { y: 0.6 }, 
                colors: ['#14b8a6', '#f59e0b', '#ffffff'] 
              });
            } else {
              const encouragementAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2800/2800-preview.mp3');
              encouragementAudio.play().catch(e => console.warn("Completion audio blocked:", e));
            }
        }
    }, [showResult, score, questions.length]);

    if (showResult) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 md:p-8 text-center animate-fadeIn">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-panel rounded-full flex items-center justify-center mb-6 shadow-xl border border-gray-700/50">
                    <Award className={`w-8 h-8 md:w-10 md:h-10 ${score === questions.length ? 'text-yellow-500' : 'text-accent'}`} />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">{score === questions.length ? "Perfect Score!" : "Quiz Complete"}</h2>
                <p className="text-text-muted mb-6 md:mb-8 text-base md:text-lg">You got <span className="text-accent font-bold">{score}</span> out of <span className="font-bold">{questions.length}</span> correct.</p>
                <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                    <button onClick={() => { setCurrentIndex(0); setScore(0); setShowResult(false); }} className="px-5 md:px-6 py-2 md:py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-all flex items-center gap-2 text-sm md:text-base">
                        <RotateCcw size={16} /> Retry Quiz
                    </button>
                    <button onClick={handleLoadNewQuiz} className="px-5 md:px-6 py-2 md:py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium transition-all flex items-center gap-2 shadow-lg shadow-accent/20 text-sm md:text-base">
                        <RotateCw size={16} /> Load New Quiz
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col items-center p-4 md:p-10 overflow-y-auto no-scrollbar">
            <div className="w-full max-w-2xl">
                <div className="mb-6 md:mb-8 flex items-center gap-4">
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-accent transition-all duration-500" style={{ width: `${((currentIndex) / questions.length) * 100}%` }} />
                    </div>
                    <span className="font-mono text-xs md:text-sm text-text-muted">{currentIndex + 1}/{questions.length}</span>
                </div>
                <div className="animate-slideUp">
                   <GamifiedQuestionCard 
                      key={currentIndex} 
                      question={questions[currentIndex]} 
                      onComplete={handleNext} 
                      onAnswer={handleAnswer} 
                      isLast={currentIndex === questions.length - 1} 
                   />
                </div>
            </div>
        </div>
    );
};

const GamifiedQuestionCard: React.FC<{ question: QuizQuestion; onComplete: () => void; onAnswer: (correct: boolean) => void; isLast: boolean; }> = ({ question, onComplete, onAnswer, isLast }) => {
    const [status, setStatus] = useState<'unanswered' | 'correct' | 'incorrect'>('unanswered');
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [hint, setHint] = useState<string | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [isLoadingHint, setIsLoadingHint] = useState(false);

    const handleSelect = async (idx: number) => {
        if (status === 'correct') return;
        setSelectedIdx(idx);
        
        const selectedOptionText = String(question.options[idx] || '');
        const isCorrect = selectedOptionText === String(question.correctAnswer || '');

        if (isCorrect) {
            setStatus('correct');
            onAnswer(true);
        } else {
            setStatus('incorrect');
            setAttempts(prev => prev + 1);
            onAnswer(false);
            setIsLoadingHint(true);
            const correctAnswerText = String(question.correctAnswer || '');
            const newHint = await generateHint(
              String(question.question || ''), 
              String(selectedOptionText || ''), 
              correctAnswerText, 
              "General Study Topic"
            );
            setHint(newHint);
            setIsLoadingHint(false);
        }
    };
    return (
        <div className="bg-panel p-5 md:p-8 rounded-2xl border border-gray-700/50 shadow-xl relative overflow-hidden">
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
                <div className="bg-yellow-900/10 border-l-4 border-yellow-500 p-3 md:p-4 rounded-r-lg mb-6 animate-fadeIn">
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
                <div className="bg-green-900/10 border-l-4 border-green-500 p-3 md:p-4 rounded-r-lg mb-6">
                      <div className="flex gap-2 md:gap-3">
                          <Info size={20} className="text-green-600 dark:text-green-500 shrink-0 mt-1" />
                          <div>
                             <span className="font-bold text-green-700 dark:text-green-400 text-xs md:text-sm block mb-1">Why it's right</span>
                             <p className="text-green-800 dark:text-green-100 text-sm md:text-base leading-relaxed">{String(question.explanation || "Great job!")}</p>
                          </div>
                      </div>
                </div>
            )}
            {status === 'correct' && (
                <div className="flex justify-end">
                    <button onClick={onComplete} className="px-6 md:px-8 py-2 md:py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 text-sm md:text-base">
                        {isLast ? "See Results" : "Next Question"} <ArrowRight size={18} />
                    </button>
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
    // Re-initialize nodes on data change, filtering for root children to keep it clean
    const filteredNodes = initialNodes.filter(n => n.parentId === 'root' || n.id === 'root');
    setNodes(filteredNodes);
    
    const root = initialNodes.find(n => n.id === 'root') || { 
      id: 'root', 
      label: String(rootTopic || 'Concept Map'), 
      description: "Main Topic" 
    };
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

    // Check if we already have children for this node in the current state
    const hasChildren = nodes.some(n => n.parentId === node.id);
    if (hasChildren) return; 

    setExpandingId(node.id);
    try {
      const newSubNodes = await expandMindMapNode(
        String(rootTopic || ''),
        String(node.label || ''),
        String(node.id || ''),
        settings.useMockMode
      );
      setNodes(prev => [...prev, ...newSubNodes]);
    } catch (err) {
      console.error("Zoom Error", err);
    } finally {
      setExpandingId(null);
    }
  };

  const renderVisuals = () => {
    const rootNodeVisual = { id: 'root', label: String(rootTopic || ''), x: centerX, y: centerY, level: 0 };
    
    // Only render level 1 nodes (direct children of root) initially or those expanded
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
            // Place L2 nodes in a mini circle around the L1 parent
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
                    return (
                        <line 
                          key={`line-${node.id}`} 
                          x1={parent.x} y1={parent.y} x2={node.x} y2={node.y} 
                          stroke={node.level === 2 ? "#14b8a6" : "#4b5563"} 
                          strokeWidth="2" strokeOpacity="0.5" 
                          strokeDasharray={node.level === 2 ? "0" : "5,5"} 
                        />
                    );
                })}
            </svg>
            {allVisuals.map(node => {
                const isRoot = node.id === 'root';
                const isL2 = (node as any).level === 2;
                const isSelected = selectedNode?.id === node.id;
                const isLoading = expandingId === node.id;
                return (
                    <div 
                      key={node.id} 
                      onClick={() => handleNodeClick(node as MindMapNode)} 
                      className={`absolute z-10 cursor-pointer transition-all duration-500 transform -translate-x-1/2 -translate-y-1/2 ${isSelected ? 'scale-110 z-30' : 'hover:scale-105'}`} 
                      style={{ left: node.x, top: node.y }}
                    >
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
                        <span className="text-[10px] md:text-xs font-bold text-accent uppercase tracking-widest mb-1 block">
                          {selectedNode ? String(selectedNode.label || '') : "Concept Details"}
                        </span>
                        <h3 className="text-lg md:text-xl font-bold text-text mb-2">{expandingId ? "Expanding Concept..." : "Key Summary"}</h3>
                        <p className="text-text-muted leading-relaxed text-xs md:text-base">
                          {selectedNode ? String(selectedNode.description || '') : "Select a bubble to see details."}
                        </p>
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
  const nextCard = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => (prev + 1) % cards.length), 300); };
  const prevCard = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length), 300); };
  const currentCard = cards[currentIndex];
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto pb-10 px-4 md:px-6">
      <div className="mb-4 md:mb-6 flex gap-1.5 md:gap-2">{cards.map((_, idx) => ( <div key={idx} className={`h-1 md:h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 md:w-8 bg-accent' : 'w-1.5 md:w-2 bg-gray-700'}`} /> ))}</div>
      <div className="w-full aspect-[4/3] md:aspect-[3/2] perspective-1000 mb-6 md:mb-10 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          <div className="absolute inset-0 backface-hidden bg-panel border border-gray-700/50 rounded-2xl md:rounded-3xl flex flex-col shadow-2xl overflow-hidden">
              <div className="h-1.5 md:h-2 w-full bg-accent/20"></div>
              <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8">
                <span className="text-[10px] md:text-xs font-bold text-accent tracking-[0.2em] uppercase mb-4">Topic</span>
                <h3 className="text-2xl md:text-5xl font-bold text-text text-center">{String(currentCard.term || '')}</h3>
             </div>
          </div>
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-2xl md:rounded-3xl flex flex-col shadow-2xl border border-gray-600 overflow-hidden">
              <div className="bg-accent px-4 py-3 md:px-6 md:py-4 flex justify-between items-center"><h3 className="font-bold text-white text-base md:text-lg">{String(currentCard.term || '')}</h3></div>
              <div className="flex-1 flex items-center justify-center p-6 md:p-8"><p className="text-base md:text-2xl font-medium text-center leading-relaxed text-gray-100">{String(currentCard.definition || '')}</p></div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 md:gap-6">
        <button onClick={prevCard} className="px-4 md:px-8 py-2.5 md:py-4 rounded-xl md:rounded-2xl bg-panel border border-gray-700/50 hover:bg-gray-700/50 text-text transition-all active:scale-95 text-xs md:text-base">Previous</button>
        <span className="text-sm md:text-xl font-mono text-text-muted w-16 md:w-20 text-center font-bold">{currentIndex + 1} / {cards.length}</span>
        <button onClick={nextCard} className="px-4 md:px-8 py-2.5 md:py-4 rounded-xl md:rounded-2xl bg-panel border border-gray-700/50 hover:bg-gray-700/50 text-text transition-all active:scale-95 text-xs md:text-base">Next</button>
      </div>
    </div>
  );
};

/* --- PREDICTIONS MODE --- */
const PredictionsMode: React.FC<{ predictions?: ExamPredictions }> = ({ predictions }) => {
    const { bionicReading, microChunking } = useAccessibility();
    const [secretRevealed, setSecretRevealed] = useState(false);
    const [mcqRevealed, setMcqRevealed] = useState(false);

    if (!predictions) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-text-muted p-6 text-center">
               <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin mb-4" />
               <p className="text-sm md:text-base">Consulting with Senior Examiners...</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-4 md:p-10">
            <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-fadeIn">
                
                {/* Header */}
                <div className="text-center mb-6 md:mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-3 mb-2">
                        <Shield className="text-purple-500 w-6 h-6 md:w-8 md:h-8" /> 
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                            Examiner's Confidential
                        </span>
                    </h2>
                    <p className="text-[10px] md:text-sm text-text-muted text-sm uppercase tracking-widest border border-purple-500/30 inline-block px-3 py-1 rounded-full bg-purple-900/10">
                        Top Secret • For Your Eyes Only
                    </p>
                </div>

                {/* 1. Long Answer (5 Marks) */}
                <div className="bg-panel border border-red-500/30 rounded-2xl overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] md:text-xs font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-bl-xl shadow-lg z-10">
                        90% PROBABILITY
                    </div>
                    <div className="p-5 md:p-8 bg-gradient-to-br from-red-900/10 to-transparent">
                        <div className="flex items-start gap-3 md:gap-4 mb-4">
                            <div className="bg-red-500/20 p-2 md:p-3 rounded-lg text-red-400 shrink-0">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h3 className="text-red-400 font-bold uppercase tracking-wider text-[10px] md:text-sm mb-1">5 Marks • High Probability</h3>
                                <div className="text-lg md:text-2xl font-bold text-text leading-relaxed">
                                    {applyAccessibilityTransforms(predictions.longAnswer.question, bionicReading, false)}
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-black/20 rounded-xl p-4 md:p-5 border border-white/5 mb-6">
                            <h4 className="text-xs font-bold text-text-muted uppercase mb-3">Model Answer Key</h4>
                            <div className="text-gray-300 leading-relaxed font-serif text-base md:text-lg">
                                {applyAccessibilityTransforms(predictions.longAnswer.modelAnswer, bionicReading, microChunking)}
                            </div>
                        </div>

                        <button 
                            onClick={() => setSecretRevealed(!secretRevealed)}
                            className={`w-full py-3 md:py-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all group ${
                                secretRevealed 
                                ? 'border-purple-500 bg-purple-500/10 text-purple-300' 
                                : 'border-gray-600 hover:border-gray-400 text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            {secretRevealed ? <Unlock size={16} /> : <Lock size={16} />}
                            <span className="font-bold tracking-wider text-xs md:text-sm">
                                {secretRevealed ? "EXAMINER SECRET REVEALED" : "TAP TO REVEAL EXAMINER SECRET"}
                            </span>
                        </button>
                        
                        {secretRevealed && (
                            <div className="mt-4 p-3 md:p-4 bg-purple-900/20 border-l-4 border-purple-500 rounded-r-xl animate-slideUp">
                                <div className="text-purple-200 italic font-medium text-sm md:text-base">
                                    "{applyAccessibilityTransforms(predictions.longAnswer.examinerSecret, bionicReading, false)}"
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Grid for Short Answer & MCQ */}
                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                    
                    {/* 2. Short Reasoning (Trap) */}
                    <div className="bg-panel border border-amber-500/30 rounded-2xl overflow-hidden shadow-lg flex flex-col">
                         <div className="bg-amber-900/20 p-3 md:p-4 border-b border-amber-500/20 flex items-center gap-2 md:gap-3">
                             <AlertTriangle className="text-amber-500" size={18} />
                             <h3 className="font-bold text-amber-500 uppercase tracking-wider text-[10px] md:text-sm">Student Trap (2 Marks)</h3>
                         </div>
                         <div className="p-5 md:p-6 flex-1 flex flex-col">
                             <div className="font-bold text-base md:text-lg mb-4 text-text">{applyAccessibilityTransforms(predictions.shortReasoning.question, bionicReading, false)}</div>
                             <div className="flex-1 bg-black/20 rounded-lg p-3 md:p-4 mb-4 border border-white/5 text-sm md:text-base">
                                 <div className="text-gray-300">{applyAccessibilityTransforms(predictions.shortReasoning.answer, bionicReading, microChunking)}</div>
                             </div>
                             <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                                 <span className="text-[10px] font-bold text-amber-500 uppercase block mb-1">⚠️ Where students fail:</span>
                                 <div className="text-amber-200 text-xs md:text-sm">{applyAccessibilityTransforms(predictions.shortReasoning.studentTrap, bionicReading, false)}</div>
                             </div>
                         </div>
                    </div>

                    {/* 3. MCQ (Precision) */}
                    <div className="bg-panel border border-blue-500/30 rounded-2xl overflow-hidden shadow-lg flex flex-col">
                         <div className="bg-blue-900/20 p-3 md:p-4 border-b border-blue-500/20 flex items-center gap-2 md:gap-3">
                             <Target className="text-blue-500" size={18} />
                             <h3 className="font-bold text-blue-500 uppercase tracking-wider text-[10px] md:text-sm">Precision Check (MCQ)</h3>
                         </div>
                         <div className="p-5 md:p-6 flex-1 flex flex-col">
                             <div className="font-bold text-base md:text-lg mb-4 text-text">{applyAccessibilityTransforms(predictions.mcq.question, bionicReading, false)}</div>
                             <div className="space-y-1.5 md:space-y-2 mb-4">
                                 {predictions.mcq.options.map((opt, i) => (
                                     <div key={i} className={`p-2 rounded border text-xs md:text-sm ${
                                         mcqRevealed && String(opt || '') === String(predictions.mcq.correct || '')
                                         ? 'bg-green-500/20 border-green-500 text-green-300' 
                                         : 'bg-black/20 border-gray-700 text-gray-400'
                                     }`}>
                                         {applyAccessibilityTransforms(opt, bionicReading, false)} {mcqRevealed && String(opt || '') === String(predictions.mcq.correct || '') && <CheckCircle size={12} className="inline ml-1.5"/>}
                                     </div>
                                 ))}
                             </div>
                             {!mcqRevealed ? (
                                 <button onClick={() => setMcqRevealed(true)} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs md:text-sm transition-colors">
                                     Reveal Answer & Twist
                                 </button>
                             ) : (
                                 <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 animate-fadeIn">
                                     <span className="text-[10px] font-bold text-blue-400 uppercase block mb-1">🎯 The Twist:</span>
                                     <div className="text-blue-200 text-xs md:text-sm">{applyAccessibilityTransforms(predictions.mcq.twist, bionicReading, false)}</div>
                                 </div>
                             )}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeDisplay;
