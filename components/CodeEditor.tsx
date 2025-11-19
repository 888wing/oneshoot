import React from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, placeholder }) => {
  return (
    <div className="relative w-full h-full bg-dark-900 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
      <div className="bg-dark-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-mono">index.html (Paste your full game code here)</span>
        <div className="flex space-x-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
        </div>
      </div>
      <textarea
        className="flex-1 w-full p-4 bg-dark-900 text-slate-300 font-mono text-sm focus:outline-none resize-none leading-relaxed"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "<!DOCTYPE html>\n<html>\n..."}
        spellCheck={false}
      />
    </div>
  );
};