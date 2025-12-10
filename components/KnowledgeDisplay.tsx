import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, HelpCircle, Network, Zap, Volume2, RotateCw, StickyNote, CheckCircle, XCircle, Info, Play, Pause } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AnalysisResult, TabType, QuizQuestion, MindMapNode } from '../types';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useAudio } from '../contexts/AudioContext';

interface KnowledgeDisplayProps {
  data: AnalysisResult | null;
  isProcessing: boolean;
}

const KnowledgeDisplay: React.FC<KnowledgeDisplayProps> = ({ data, isProcessing }) => {
  const [activeTab, setActiveTab] = useState<TabType>('story');

  const renderContent = () => {
    if (isProcessing) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-pulse-glow">
          <div className="w-24 h-24 bg-panel rounded-full flex items-center justify-center mb-6">
            <Network className="w-12 h-12 text-accent animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">CogniVibe AI is Thinking...</h2>
          <p className="text-text-muted max-w-md">
            Gemini Pro is analyzing your content to create a personalized study plan.
          </p>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
          <div className="w-24 h-24 bg-panel rounded-full flex items-center justify-center mb-6 grayscale">
            <BookOpen className="w-10 h-10 text-gray-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Waiting for Input</h2>
          <p className="text-text-muted max-w-sm">
            Upload an image on the left to generate your personalized study companion.
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case 'story':
        return <StoryMode story={data.story} cheatSheet={data.cheatSheet} />;
      case 'quiz':
        return <QuizMode questions={data.quiz} />;
      case 'mindmap':
        return <MindMapMode rootNode={data.mindMap} />;
      case 'flashcards':
        return <FlashcardMode cards={data.flashcards} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-panel/50">
      {/* Tab Navigation */}
      <div className="flex items-center px-6 pt-4 border-b border-gray-700 bg-panel overflow-x-auto no-scrollbar">
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
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 relative custom-scrollbar pb-24">
        {renderContent()}
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
      active
        ? 'border-accent text-accent'
        : 'border-transparent text-text-muted hover:text-white hover:bg-gray-700/30'
    }`}
  >
    {icon}
    {label}
  </button>
);

/* --- Sub-Components --- */

const StoryMode: React.FC<{ story: string; cheatSheet: string[] }> = ({ story, cheatSheet }) => {
  const { bionicReading, microChunking } = useAccessibility();
  const { playText, togglePlay, isPlaying, text } = useAudio();
  
  // Auto-set the audio text when story loads, but don't auto-play
  useEffect(() => {
    // Only update if it's different to prevent loops
    if (text !== story) {
        // We don't call playText here to avoid auto-play, 
        // we just might want to inform the context if we supported a "queue" system
    }
  }, [story, text]);

  const handleListenClick = () => {
      if (text !== story) {
          playText(story);
      } else {
          togglePlay();
      }
  };

  const processBionic = (text: string) => {
    return text.split(' ').map((word, i) => {
      if (word.length < 2) return <span key={i}>{word} </span>;
      const splitIdx = Math.ceil(word.length / 2);
      const start = word.slice(0, splitIdx);
      const end = word.slice(splitIdx);
      return (
        <span key={i}>
          <b className="font-bold text-white">{start}</b>
          <span className="opacity-80">{end} </span>
        </span>
      );
    });
  };

  const renderText = () => {
    if (microChunking) {
      // Split paragraphs into bullet points based on sentences
      const sentences = story.match(/[^.!?]+[.!?]+/g) || [story];
      return (
        <ul className="space-y-4">
          {sentences.map((sent, idx) => (
            <li key={idx} className="flex gap-3 bg-panel p-4 rounded-lg border border-gray-700">
              <span className="text-accent mt-1">•</span>
              <span className="leading-relaxed">
                {bionicReading ? processBionic(sent) : sent}
              </span>
            </li>
          ))}
        </ul>
      );
    }

    return (
      <div className="prose prose-invert prose-lg leading-relaxed text-gray-300">
         {story.split('\n').map((paragraph, idx) => {
            if (!paragraph.trim()) return null;
            return (
              <p key={idx} className="mb-4">
                {bionicReading ? processBionic(paragraph) : paragraph}
              </p>
            );
         })}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn relative">
      
      {/* Cheat Sheet Sticky Note */}
      {cheatSheet && cheatSheet.length > 0 && (
        <div className="mb-8 bg-yellow-200/90 text-yellow-900 p-6 rounded-lg shadow-lg rotate-1 transform transition-transform hover:rotate-0 border-l-8 border-yellow-400">
          <div className="flex items-center gap-2 mb-3">
             <StickyNote size={20} className="text-yellow-700"/>
             <h3 className="font-bold text-lg uppercase tracking-wide">TL;DR Cheat Sheet</h3>
          </div>
          <ul className="list-disc pl-5 space-y-1 font-medium">
            {cheatSheet.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <BookOpen className="text-accent" /> The Narrative
        </h2>
        <div className="flex items-center gap-3 bg-panel p-2 rounded-xl border border-gray-700">
           <button 
             onClick={handleListenClick}
             className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${isPlaying && text === story ? 'bg-accent text-white' : 'bg-accent/20 text-accent hover:bg-accent/30'}`}
           >
             {isPlaying && text === story ? <Pause size={18} /> : <Play size={18} />}
             {isPlaying && text === story ? 'Pause' : 'Listen'}
           </button>
        </div>
      </div>

      <div id="story-content" className="transition-opacity duration-300">
        {renderText()}
      </div>
    </div>
  );
};

const QuizMode: React.FC<{ questions: QuizQuestion[] }> = ({ questions }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [internalQuestions, setInternalQuestions] = useState(questions);

  // Reset when questions prop changes (new file loaded)
  useEffect(() => {
    setInternalQuestions(questions);
    setSelectedAnswers({});
    setShowResults(false);
  }, [questions]);

  const handleSelect = (qId: number, optionIdx: number) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const playCelebrationSound = () => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; 
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.1);
      gain.gain.setValueAtTime(0.1, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
      osc.stop(now + i * 0.1 + 0.5);
    });
  };

  const handleCheckAnswers = () => {
    setShowResults(true);
    const score = internalQuestions.reduce((acc, q) => acc + (selectedAnswers[q.id] === q.correctAnswer ? 1 : 0), 0);
    
    // Celebration Mode
    if (score === internalQuestions.length) {
      playCelebrationSound();
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#14b8a6', '#f3f4f6', '#f59e0b']
      });
    }
  };

  const score = internalQuestions.reduce((acc, q) => acc + (selectedAnswers[q.id] === q.correctAnswer ? 1 : 0), 0);

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Knowledge Check</h2>
        {showResults && (
          <span className={`px-4 py-1 rounded-full font-bold animate-bounce ${score === internalQuestions.length ? 'bg-green-500 text-white shadow-lg shadow-green-500/50' : 'bg-accent text-background'}`}>
            Score: {score} / {internalQuestions.length}
          </span>
        )}
      </div>
      
      <div className="space-y-8">
        {internalQuestions.map((q) => {
          const isCorrect = selectedAnswers[q.id] === q.correctAnswer;
          const userSelected = selectedAnswers[q.id];

          return (
            <div key={q.id} className="bg-panel p-6 rounded-xl border border-gray-700 shadow-md">
              <h3 className="text-lg font-medium text-white mb-4">{q.question}</h3>
              <div className="space-y-3">
                {q.options.map((opt: string, idx: number) => {
                  let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ";
                  
                  if (showResults) {
                    if (idx === q.correctAnswer) {
                       btnClass += "bg-green-500/10 border-green-500 text-green-200";
                    } else if (userSelected === idx) {
                       btnClass += "bg-red-500/10 border-red-500 text-red-200";
                    } else {
                       btnClass += "border-gray-700 text-gray-500 opacity-50";
                    }
                  } else {
                    if (userSelected === idx) {
                        btnClass += "bg-accent/10 border-accent text-accent";
                    } else {
                        btnClass += "border-gray-700 hover:border-gray-500 hover:bg-gray-700/50 text-gray-300";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(q.id, idx)}
                      className={btnClass}
                      disabled={showResults}
                    >
                      <span>{opt}</span>
                      {showResults && idx === q.correctAnswer && <CheckCircle size={20} className="text-green-500" />}
                      {showResults && userSelected === idx && idx !== q.correctAnswer && <XCircle size={20} className="text-red-500" />}
                    </button>
                  );
                })}
              </div>
              {showResults && (
                  <div className={`mt-4 p-4 rounded-lg text-sm border-l-4 ${isCorrect ? 'bg-green-900/20 border-green-500 text-green-200' : 'bg-red-900/20 border-red-500 text-red-200'}`}>
                      <span className="font-bold block mb-1">{isCorrect ? 'Correct!' : 'Incorrect.'}</span>
                      {q.explanation}
                  </div>
              )}
            </div>
          );
        })}
      </div>

      {!showResults && Object.keys(selectedAnswers).length > 0 && (
        <button
          onClick={handleCheckAnswers}
          className="w-full mt-8 py-4 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-1"
        >
          Check Answers
        </button>
      )}
      {showResults && (
           <button
           onClick={() => {
               setShowResults(false);
               setSelectedAnswers({});
           }}
           className="w-full mt-8 py-4 bg-panel hover:bg-gray-700 border border-gray-600 text-white font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-1"
         >
           Reset Quiz
         </button>
      )}
    </div>
  );
};

const MindMapMode: React.FC<{ rootNode: MindMapNode }> = ({ rootNode }) => {
  const [selectedNode, setSelectedNode] = useState<MindMapNode>(rootNode);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
      });
    }
  }, []);
  
  // Update dimensions on resize
  useEffect(() => {
      const handleResize = () => {
          if (containerRef.current) {
            setDimensions({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight
            });
          }
      }
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height * 0.45;
  const radius = Math.min(centerX, centerY) * 0.65; 
  const children = rootNode.children || [];
  const angleStep = (2 * Math.PI) / (children.length || 1);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#252525] rounded-xl border border-gray-800">
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {children.map((child, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          return (
            <line
              key={`line-${child.id}`}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke="#4b5563"
              strokeWidth="2"
              strokeDasharray="5,5"
              className="opacity-50"
            />
          );
        })}
      </svg>

      <div 
        onClick={() => setSelectedNode(rootNode)}
        className={`absolute z-20 cursor-pointer transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2
          ${selectedNode.id === rootNode.id ? 'scale-110 ring-4 ring-accent/30' : 'hover:scale-105'}
        `}
        style={{ left: centerX, top: centerY }}
      >
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-accent flex items-center justify-center p-2 shadow-2xl shadow-accent/20 animate-pulse-glow">
           <span className="text-white font-bold text-center text-sm md:text-base leading-tight drop-shadow-md">
             {rootNode.label}
           </span>
        </div>
      </div>

      {children.map((child, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        const isSelected = selectedNode.id === child.id;

        return (
          <div
            key={child.id}
            onClick={() => setSelectedNode(child)}
            className={`absolute z-10 cursor-pointer transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2
               ${isSelected ? 'scale-110 z-30' : 'hover:scale-105'}
            `}
            style={{ left: x, top: y }}
          >
            <div 
              className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center p-2 shadow-xl border-2 transition-colors
                ${isSelected ? 'bg-white text-accent border-accent' : 'bg-panel text-gray-300 border-gray-600 hover:border-accent/50'}
              `}
            >
              <span className="font-semibold text-center text-xs md:text-sm leading-tight overflow-hidden text-ellipsis line-clamp-3">
                {child.label}
              </span>
            </div>
          </div>
        );
      })}

      <div className="absolute bottom-6 left-6 right-6 bg-panel/90 backdrop-blur-md border border-gray-700 p-6 rounded-2xl shadow-2xl transition-all animate-slideUp">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-accent/10 rounded-xl">
             <Info className="text-accent w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">{selectedNode.label}</h3>
            <p className="text-gray-300 leading-relaxed text-sm md:text-base">
              {selectedNode.description || "Click on a bubble to explore the concept details."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const FlashcardMode: React.FC<{ cards: any[] }> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev + 1) % cards.length), 300);
  };
  
  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length), 300);
  };

  const currentCard = cards[currentIndex];

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto pb-10">
      <div className="w-full aspect-[3/2] perspective-1000 mb-8 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          <div className="absolute inset-0 backface-hidden bg-panel border-2 border-accent/30 rounded-2xl flex flex-col items-center justify-center p-8 shadow-2xl group-hover:border-accent transition-colors group-hover:shadow-accent/10">
            <span className="absolute top-4 left-4 text-xs font-bold text-accent tracking-widest uppercase">Term</span>
            <h3 className="text-3xl md:text-4xl font-bold text-white text-center drop-shadow-lg">{currentCard.front}</h3>
            <div className="absolute bottom-6 flex items-center gap-2 text-sm text-text-muted animate-bounce">
                Tap to Flip <RotateCw size={14}/>
            </div>
          </div>
          
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-accent to-teal-700 text-white rounded-2xl flex flex-col items-center justify-center p-8 shadow-2xl border-2 border-white/20">
             <span className="absolute top-4 left-4 text-xs font-bold text-white/70 tracking-widest uppercase">Definition</span>
            <p className="text-lg md:text-xl font-medium text-center leading-relaxed">{currentCard.back}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button onClick={prevCard} className="px-6 py-3 rounded-xl bg-panel border border-gray-600 hover:bg-gray-700 text-white transition-all shadow-lg hover:shadow-xl active:scale-95">
            Previous
        </button>
        <span className="text-lg font-mono text-text-muted w-16 text-center">{currentIndex + 1} / {cards.length}</span>
        <button onClick={nextCard} className="px-6 py-3 rounded-xl bg-panel border border-gray-600 hover:bg-gray-700 text-white transition-all shadow-lg hover:shadow-xl active:scale-95">
            Next
        </button>
      </div>
    </div>
  );
};

export default KnowledgeDisplay;