import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLiveDictation } from '../hooks/useLiveDictation';
import { generateSpeech, summarizeText } from '../services/geminiService';
import { decodeAudioData } from '../utils/audioUtils';
import Visualizer from './Visualizer';
import TextArea from './TextArea';
import { SavedTranscript } from '../types';
import { 
    MicIcon, SquareIcon, CopyIcon, SparklesIcon, VolumeIcon, 
    LoaderIcon, MenuIcon, SaveIcon, TrashIcon, StarIcon, 
    SearchIcon, PlusIcon, CloseIcon 
} from './Icons';

// Helper for tooltips (kept local)
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

interface DictationInterfaceProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const DictationInterface: React.FC<DictationInterfaceProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
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
    setHistoryText('');
    setCurrentText('');
  };

  const handleLoadTranscript = (transcript: SavedTranscript) => {
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
    <div className="flex-1 flex flex-row h-full overflow-hidden relative">
      {/* Sidebar / History Panel */}
      <div className={`
          fixed inset-y-0 left-0 z-40 h-full bg-white border-r border-slate-200 shadow-2xl transition-all duration-300 ease-in-out
          md:relative md:shadow-none
          ${isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full md:translate-x-0 md:w-0'}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full transition-all duration-300 relative">
          
          {/* Header */}
          <header className="flex items-center justify-between px-4 md:px-6 py-4 bg-white border-b border-slate-200 shadow-sm z-10 shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ${isSidebarOpen ? 'md:opacity-0 pointer-events-none' : 'opacity-100'}`}>
                 <MenuIcon />
              </button>
              
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md">
                    <MicIcon />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dictation</h1>
                    <p className="text-xs text-slate-500 font-medium">Real-time Transcription</p>
                  </div>
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

          <main className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
            <div className="flex-1 relative h-full bg-white flex flex-col">
                <div className="flex-1 overflow-hidden relative">
                     <TextArea 
                        value={fullText} 
                        onChange={handleTextChange} 
                        placeholder="Tap the microphone to start dictating..."
                    />
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
                            {isRecording && (
                                <span className="absolute -inset-1 rounded-full border border-rose-500 opacity-50 animate-ping"></span>
                            )}
                         </button>
                     </div>
                </div>
                
                <div className={`h-12 border-t border-slate-100 bg-slate-50 flex items-center justify-center transition-all duration-300 ${isRecording ? 'opacity-100' : 'opacity-0'}`}>
                    <Visualizer level={audioLevel} isActive={isRecording} />
                </div>
            </div>

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
          
          {error && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-50 text-red-600 px-4 py-3 rounded-lg shadow-lg border border-red-100 flex items-center gap-2 animate-bounce z-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Overlay for mobile sidebar */}
          {isSidebarOpen && (
            <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
          )}
      </div>
    </div>
  );
}

export default DictationInterface;