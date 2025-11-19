import React, { useRef, useState } from 'react';
import { Button } from './Button';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, placeholder }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
  };

  const readFile = (file: File) => {
    if (file.name.endsWith('.html') || file.name.endsWith('.htm') || file.type === 'text/html') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onChange(text);
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a valid HTML file.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  return (
    <div 
      className={`relative w-full h-full bg-dark-900 rounded-lg border overflow-hidden flex flex-col transition-colors ${isDragging ? 'border-brand-500 bg-dark-800' : 'border-slate-700'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="bg-dark-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">index.html</span>
          <span className="text-xs text-slate-600 bg-dark-900 px-2 py-0.5 rounded border border-slate-700">
            {value.length > 0 ? `${(value.length / 1024).toFixed(2)} KB` : 'Empty'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".html,.htm"
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-xs flex items-center text-brand-400 hover:text-brand-300 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload File
          </button>
          <div className="flex space-x-1.5 ml-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
          </div>
        </div>
      </div>
      
      <div className="relative flex-1 flex flex-col">
        {isDragging && (
          <div className="absolute inset-0 z-10 bg-brand-900/20 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-brand-500 m-2 rounded-lg">
            <p className="text-brand-200 font-bold text-lg animate-pulse">Drop HTML file here</p>
          </div>
        )}
        <textarea
          className="flex-1 w-full p-4 bg-dark-900 text-slate-300 font-mono text-sm focus:outline-none resize-none leading-relaxed"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "<!DOCTYPE html>\n<html>\n<!-- Paste code or drop an .html file here -->\n..."}
          spellCheck={false}
        />
      </div>
    </div>
  );
};