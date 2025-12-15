import React, { useRef, useEffect, useState } from 'react';
import { Message, useChat } from '../hooks/useChat';
import { SendIcon, BotIcon, LoaderIcon } from './Icons';

const ChatInterface: React.FC = () => {
  const { messages, sendMessage, isLoading } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
                    <BotIcon />
                </div>
                <p className="text-lg font-medium">How can I help you today?</p>
            </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                {msg.text || (isLoading && msg.role === 'model' ? <span className="animate-pulse">Thinking...</span> : '')}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-center gap-2">
          <input
            type="text"
            className="w-full bg-slate-100 text-slate-900 rounded-xl px-5 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border-0 placeholder-slate-400 transition-all"
            placeholder="Ask anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 transition-colors"
          >
             {isLoading ? <LoaderIcon /> : <SendIcon />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;