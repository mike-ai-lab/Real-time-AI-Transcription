import React, { useState } from 'react';
import DictationInterface from './components/DictationInterface';
import ChatInterface from './components/ChatInterface';
import { MicIcon, ChatBubbleIcon } from './components/Icons';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dictation' | 'chat'>('dictation');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
        {/* Navigation Tabs (Top for ease of access) */}
        <div className="flex items-center justify-center p-2 bg-white border-b border-slate-200 shrink-0 z-20">
            <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                    onClick={() => setActiveTab('dictation')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                        activeTab === 'dictation' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <MicIcon />
                    Dictate
                </button>
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                        activeTab === 'chat' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <ChatBubbleIcon />
                    Assistant
                </button>
            </div>
        </div>

        {/* View Content */}
        <div className="flex-1 overflow-hidden relative">
            {activeTab === 'dictation' ? (
                <DictationInterface isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            ) : (
                <ChatInterface />
            )}
        </div>
    </div>
  );
}