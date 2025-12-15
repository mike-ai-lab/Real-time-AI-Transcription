import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLiveDictation } from './hooks/useLiveDictation';
import { generateSpeech, summarizeText } from './services/geminiService';
import { decodeAudioData } from './utils/audioUtils';
import Visualizer from './components/Visualizer';
import TextArea from './components/TextArea';
import { SavedTranscript } from './types';

// Icons
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
);
const SquareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
);
const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
);
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 3v4"/><path d="M3 7h4"/><path d="M3 5h4"/></svg>
);
const VolumeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
);
const LoaderIcon = () => (
  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
);
const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
);
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

export default function App() {
  // Load initial draft from storage if available
  const [historyText, setHistoryText] = useState(() => localStorage.getItem('gemini_dictation_draft') || '');
  const [currentText, setCurrentText] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Library State
  const [transcripts, setTranscripts] = useState<SavedTranscript[]>(() => {
    try {
      const saved = localStorage.getItem('gemini_dictation_library');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Loading states for actions
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Audio Context for playback
  const audioContextRef = useRef<AudioContext | null>(null);

  // Combine history and current processing text for display
  const fullText = historyText + currentText;

  // Persist draft whenever fullText changes
  useEffect(() => {
    localStorage.setItem('gemini_dictation_draft', fullText);
  }, [fullText]);

  // Persist library whenever transcripts change
  useEffect(() => {
    localStorage.setItem('gemini_dictation_library', JSON.stringify(transcripts));
  }, [transcripts]);

  const handleTranscriptionUpdate = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      setHistoryText(prev => {
         // Auto-add space if needed
         const needsSpace = prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n');
         return prev + (needsSpace ? ' ' : '') + text;
      });
      setCurrentText('');
    } else {
      setCurrentText(text);
    }
  }, []);

  const handleDictationError = useCallback((err: string) => {
    setError(err);
    setTimeout(() => setError(null), 5000);
  }, []);

  const { isRecording, audioLevel, start, stop } = useLiveDictation({
    onTranscriptionUpdate: handleTranscriptionUpdate,
    onError: handleDictationError,
  });

  const toggleRecording = () => {
    if (isRecording) {
      stop();
    } else {
      start();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
  };

  const handleSummarize = async () => {
    if (!fullText.trim()) return;
    setIsSummarizing(true);
    try {
      const summary = await summarizeText(fullText);
      setHistoryText(prev => prev + `\n\n--- Summary ---\n${summary}\n`);
    } catch (e) {
      setError("Failed to summarize.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSpeak = async () => {
    if (!fullText.trim() || isSpeaking) return;
    setIsSpeaking(true);
    try {
      const base64Audio = await generateSpeech(fullText.substring(0, 1000));
      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        const audioBuffer = await decodeAudioData(base64Audio, ctx, 24000);
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to generate speech.");
      setIsSpeaking(false);
    }
  };

  const handleSaveToLibrary = () => {
    if (!fullText.trim()) return;
    const newTranscript: SavedTranscript = {
      id: Date.now().toString(),
      content: fullText,
      createdAt: Date.now(),
      isFavorite: false,
    };
    setTranscripts(prev => [newTranscript, ...prev]);
    // Clear editor after save
    setHistoryText('');
    setCurrentText('');
  };

  const handleLoadTranscript = (transcript: SavedTranscript) => {
    // If currently recording, stop it
    if (isRecording) stop();
    setHistoryText(transcript.content);
    setCurrentText('');
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleDeleteTranscript = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTranscripts(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTranscripts(prev => prev.map(t => t.id === id ? { ...t, isFavorite: !t.isFavorite } : t));
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear the current text?")) {
        setHistoryText('');
        setCurrentText('');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHistoryText(e.target.value);
    setCurrentText('');
  };

  const filteredTranscripts = transcripts.filter(t => 
    t.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full bg-slate-50 relative overflow-hidden">
      
      {/* Sidebar / History Panel */}
      <div className={`
          fixed inset-y-0 left-0 z-40 h-full bg-white border-r border-slate-200 shadow-2xl transition-all duration-300 ease-in-out
          md:relative md:shadow-none
          w-80
          ${isSidebarOpen ? 'translate-x-0 md:w-80' : '-translate-x-full md:w-0 md:translate-x-0'}
          overflow-hidden
      `}>
         <div className="w-80 h-full flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
               <h2 className="font-semibold text-slate-800">History</h2>
               <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <CloseIcon />
               </button>
            </div>
            
            <div className="p-4 border-b border-slate-100">
               <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search transcripts..." 
                    className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="absolute left-3 top-2.5 text-slate-400">
                     <SearchIcon />
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
               {filteredTranscripts.length === 0 ? (
                 <div className="text-center text-slate-400 py-10 text-sm">No saved transcripts found.</div>
               ) : (
                 filteredTranscripts.map(t => (
                   <div key={t.id} onClick={() => handleLoadTranscript(t)} className="group p-3 rounded-xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-xs text-slate-400 font-medium">
                            {new Date(t.createdAt).toLocaleDateString()} • {new Date(t.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </span>
                         <div className="flex gap-1">
                            <button onClick={(e) => handleToggleFavorite(e, t.id)} className={`p-1.5 rounded-md hover:bg-slate-100 ${t.isFavorite ? 'text-amber-400' : 'text-slate-300'}`}>
                               <StarIcon filled={t.isFavorite} />
                            </button>
                            <button onClick={(e) => handleDeleteTranscript(e, t.id)} className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50">
                               <TrashIcon />
                            </button>
                         </div>
                      </div>
                      <p className="text-sm text-slate-700 line-clamp-3 font-medium leading-relaxed">
                        {t.content}
                      </p>
                   </div>
                 ))
               )}
            </div>
         </div>
      </div>

      {/* Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-full transition-all duration-300">
          
          {/* Header */}
          <header className="flex items-center justify-between px-4 md:px-6 py-4 bg-white border-b border-slate-200 shadow-sm z-10 shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                 <MenuIcon />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md">
                <MicIcon />
              </div>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gemini Dictate</h1>
                <p className="text-xs text-slate-500 font-medium">Real-time AI Transcription</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
                 <button 
                    onClick={handleSaveToLibrary} 
                    disabled={!fullText.trim()}
                    className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    <SaveIcon />
                    Save Note
                 </button>

                 <button 
                    onClick={handleClear} 
                    className="flex md:hidden items-center justify-center w-10 h-10 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                 >
                    <PlusIcon />
                 </button>

                {/* Status Indicator */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                    isRecording 
                    ? 'bg-rose-50 text-rose-600 border-rose-100' 
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                    {isRecording ? (
                        <>
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                            <span className="hidden sm:inline">Listening...</span>
                        </>
                    ) : (
                        <>
                             <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                             <span className="hidden sm:inline">Ready</span>
                        </>
                    )}
                </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
            
            {/* Editor Container */}
            <div className="flex-1 relative h-full bg-white flex flex-col">
                <div className="flex-1 overflow-hidden relative">
                     <TextArea 
                        value={fullText} 
                        onChange={handleTextChange} 
                        placeholder="Tap the microphone to start dictating..."
                    />
                     {/* Floating Start/Stop Button */}
                     <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 md:bottom-12 z-20">
                         <button
                            onClick={toggleRecording}
                            className={`group relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                                isRecording 
                                ? 'bg-white border-4 border-rose-500 text-rose-500' 
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                         >
                            {isRecording ? <SquareIcon /> : <MicIcon />}
                            
                            {/* Ripple Effect Ring when recording */}
                            {isRecording && (
                                <span className="absolute -inset-1 rounded-full border border-rose-500 opacity-50 animate-ping"></span>
                            )}
                         </button>
                     </div>
                </div>
                
                {/* Audio Visualizer Overlay at bottom of text area */}
                <div className={`h-12 border-t border-slate-100 bg-slate-50 flex items-center justify-center transition-all duration-300 ${isRecording ? 'opacity-100' : 'opacity-0'}`}>
                    <Visualizer level={audioLevel} isActive={isRecording} />
                </div>
            </div>

            {/* Sidebar / Action Bar */}
            <div className="w-full md:w-20 md:border-l border-slate-200 bg-white md:bg-slate-50 flex flex-row md:flex-col items-center justify-center md:justify-start p-4 gap-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none z-10">
                
                <div className="md:hidden">
                    <ActionTooltip label="Save Note">
                        <button onClick={handleSaveToLibrary} disabled={!fullText.trim()} className="p-3 rounded-xl bg-white text-slate-600 shadow-sm border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all disabled:opacity-50">
                            <SaveIcon />
                        </button>
                    </ActionTooltip>
                </div>
                
                <div className="hidden md:block">
                     <ActionTooltip label="New Note">
                        <button onClick={handleClear} className="p-3 rounded-xl bg-white text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-100 transition-all">
                            <PlusIcon />
                        </button>
                    </ActionTooltip>
                </div>

                <div className="w-px h-8 bg-slate-200 md:w-8 md:h-px md:mx-auto"></div>

                <ActionTooltip label="Copy Text">
                    <button onClick={handleCopy} className="p-3 rounded-xl bg-white text-slate-600 shadow-sm border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all">
                        <CopyIcon />
                    </button>
                </ActionTooltip>

                <ActionTooltip label="Summarize">
                    <button onClick={handleSummarize} disabled={isSummarizing || !fullText} className="p-3 rounded-xl bg-white text-slate-600 shadow-sm border border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSummarizing ? <LoaderIcon /> : <SparklesIcon />}
                    </button>
                </ActionTooltip>

                <ActionTooltip label="Read Aloud">
                    <button onClick={handleSpeak} disabled={isSpeaking || !fullText} className="p-3 rounded-xl bg-white text-slate-600 shadow-sm border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSpeaking ? <LoaderIcon /> : <VolumeIcon />}
                    </button>
                </ActionTooltip>

            </div>

          </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-50 text-red-600 px-4 py-3 rounded-lg shadow-lg border border-red-100 flex items-center gap-2 animate-bounce z-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span className="text-sm font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}

// Helper for tooltips
const ActionTooltip = ({ children, label }: { children: React.ReactNode, label: string }) => (
    <div className="group relative flex flex-col items-center">
        {children}
        <div className="absolute md:left-full md:top-1/2 md:-translate-y-1/2 md:ml-2 md:mt-0 top-full mt-2 hidden group-hover:block bg-slate-800 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
            {label}
            {/* Arrow for left placement (desktop) */}
            <div className="hidden md:block absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
            {/* Arrow for top placement (mobile) */}
            <div className="md:hidden absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800"></div>
        </div>
    </div>
);