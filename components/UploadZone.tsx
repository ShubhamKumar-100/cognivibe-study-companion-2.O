import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, FileText, Sparkles } from 'lucide-react';

interface UploadZoneProps {
  onAnalyze: (file: File) => void;
  isProcessing: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onAnalyze, isProcessing }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setSelectedFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      processFile(file);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const clearFile = () => {
    setPreview(null);
    setSelectedFile(null);
  };

  const handleGenerateClick = () => {
    if (selectedFile) {
      onAnalyze(selectedFile);
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      <h2 className="text-2xl font-bold mb-4 text-accent">Upload Zone</h2>
      <p className="text-text-muted mb-6">Upload your handwritten notes or diagrams to begin.</p>

      <div
        className={`flex-1 border-2 border-dashed rounded-3xl transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden ${
          isDragging
            ? 'border-accent bg-accent/10 scale-[1.02]'
            : 'border-gray-600 hover:border-gray-500 bg-panel'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {preview ? (
          <div className="relative w-full h-full flex flex-col">
            <div className="flex-1 relative flex items-center justify-center bg-black/40 p-4">
              <img
                src={preview}
                alt="Uploaded preview"
                className="max-w-full max-h-full object-contain shadow-2xl"
              />
              {!isProcessing && (
                <button
                  onClick={clearFile}
                  className="absolute top-4 right-4 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors backdrop-blur-sm z-20"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            
            {/* Action Bar for File */}
            <div className="p-6 bg-panel border-t border-gray-700 flex flex-col items-center gap-4">
              {isProcessing ? (
                 <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin"></div>
                    <p className="text-accent font-semibold animate-pulse">Analyzing content...</p>
                 </div>
              ) : (
                <button
                  onClick={handleGenerateClick}
                  className="w-full py-4 bg-accent hover:bg-accent-hover text-white rounded-xl font-bold text-lg shadow-lg shadow-accent/25 hover:shadow-accent/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={20} className="fill-white" />
                  Generate Study Companion
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-background flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Upload className="text-accent w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Drag & Drop</h3>
            <p className="text-text-muted text-center max-w-xs mb-8">
              Supports JPG, PNG, and Handwritten Notes
            </p>
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
              <span className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-accent/25 active:scale-95 flex items-center gap-2">
                <ImageIcon size={18} />
                Browse Files
              </span>
            </label>
          </>
        )}
      </div>
      
      {!preview && (
        <div className="mt-6 p-4 bg-panel rounded-xl border border-gray-700/50 flex items-start gap-3">
          <div className="p-2 bg-yellow-500/10 rounded-lg">
            <FileText className="text-yellow-500 w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Pro Tip</h4>
            <p className="text-xs text-text-muted mt-1">Ensure handwritten notes are well-lit for the best AI accuracy.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadZone;