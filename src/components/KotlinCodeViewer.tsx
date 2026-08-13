import React, { useState } from "react";
import { KOTLIN_SOURCE_FILES } from "../data/kotlinCode";
import { Code2, Copy, Check, X, FileCode, Layers } from "lucide-react";

interface KotlinCodeViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KotlinCodeViewer: React.FC<KotlinCodeViewerProps> = ({ isOpen, onClose }) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const activeFile = KOTLIN_SOURCE_FILES[selectedFileIndex];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopiedIndex(selectedFileIndex);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Code2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Code Source Android Native (Kotlin & Jetpack Compose)
              </h3>
              <p className="text-xs text-slate-400">
                Architecture Room Database, WorkManager et FLAG_SECURE
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Container */}
        <div className="flex flex-1 overflow-hidden">
          {/* File Selector Sidebar */}
          <div className="w-48 sm:w-64 bg-slate-950/60 border-r border-slate-800 p-3 overflow-y-auto space-y-1.5 flex-shrink-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1">
              Fichiers Kotlin (.kt)
            </p>

            {KOTLIN_SOURCE_FILES.map((file, idx) => {
              const isSelected = selectedFileIndex === idx;
              return (
                <button
                  key={file.filename}
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center space-x-2 text-xs font-semibold ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <FileCode size={16} className={isSelected ? "text-amber-300" : "text-slate-500"} />
                  <div className="truncate">
                    <span className="block truncate">{file.filename}</span>
                    <span className="text-[9px] opacity-70 block truncate font-mono">
                      {file.packagePath.split(".").pop()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Code View Area */}
          <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
            {/* File Info Bar */}
            <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-mono text-indigo-400 text-[11px] block">
                  package {activeFile.packagePath}
                </span>
                <p className="text-slate-300 font-semibold">{activeFile.description}</p>
              </div>

              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow transition-colors"
              >
                {copiedIndex === selectedFileIndex ? (
                  <>
                    <Check size={14} className="text-emerald-300" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copier le Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Text Area */}
            <div className="flex-1 p-4 overflow-auto font-mono text-xs text-amber-100 bg-slate-950/80 leading-relaxed scrollbar-thin">
              <pre className="whitespace-pre">{activeFile.code}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center space-x-1">
            <Layers size={14} className="text-indigo-400" />
            <span>Prêt pour exportation Android Studio</span>
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl"
          >
            Fermer le Visualiseur
          </button>
        </div>
      </div>
    </div>
  );
};
