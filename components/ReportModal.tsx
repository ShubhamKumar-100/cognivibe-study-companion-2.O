import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, FileText } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  score: number;
  totalQuestions: number;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, topic, score, totalQuestions }) => {
  const [focusTime, setFocusTime] = useState(12);
  const [copied, setCopied] = useState(false);

  // Randomize focus time slightly whenever modal opens for demo realism
  useEffect(() => {
    if (isOpen) {
      setFocusTime(Math.floor(Math.random() * (20 - 10 + 1) + 10));
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Percentage Calculation
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  // Logic for Status Message
  let statusColor = "";
  let statusTitle = "";
  let statusMessage = "";

  if (percentage === 100) {
    statusColor = "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
    statusTitle = "🌟 Mastery";
    statusMessage = "The student has shown excellent recall of the core concepts. Ready for advanced topics.";
  } else if (percentage > 0) {
    statusColor = "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
    statusTitle = "📈 Developing";
    statusMessage = "Good understanding of basics, but specific concepts need a quick review.";
  } else {
    statusColor = "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
    statusTitle = "🧠 Needs Support";
    statusMessage = "Recommend re-reading the Story Mode with 'Micro-Chunking' enabled.";
  }

  // Copy Function
  const handleCopy = () => {
    const reportText = `Student Insight Report:\nTopic: ${topic}\nScore: ${score}/${totalQuestions} (${percentage}%)\nFocus Time: ${focusTime} mins\nStatus: ${statusTitle} - ${statusMessage}`;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* Modal Card */}
      <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#2d2d2d]">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Student Progress Insight
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Topic</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{topic || "N/A"}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
               <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Focus Time</p>
               <p className="text-sm font-bold text-gray-900 dark:text-white">{focusTime} Mins</p>
            </div>
          </div>

          {/* Score Section */}
          <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-500/30">
            <div>
              <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Quiz Performance</p>
              <h3 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{score} / {totalQuestions}</h3>
            </div>
            {/* Circular Progress Badge */}
            <div className="w-12 h-12 rounded-full border-4 border-indigo-200 dark:border-indigo-500 flex items-center justify-center bg-white dark:bg-indigo-900">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-200">{percentage}%</span>
            </div>
          </div>

          {/* AI Insight Section */}
          <div className={`p-4 rounded-lg border ${statusColor} text-sm transition-colors`}>
            <p className="font-bold flex items-center gap-2 mb-1 text-base">
              {statusTitle}
            </p>
            <p className="opacity-90 leading-relaxed">
              {statusMessage}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-[#2d2d2d] border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            Close
          </button>
          <button 
            onClick={handleCopy}
            className="flex-1 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
          >
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Summary"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;