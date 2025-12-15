import { useState, useRef } from 'react';
import { ai } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export const useChat = () => {
   const [messages, setMessages] = useState<Message[]>([]);
   const [isLoading, setIsLoading] = useState(false);
   const chatSessionRef = useRef<Chat | null>(null);

   // Initialize or retrieve existing chat session
   const getChat = () => {
     if (!chatSessionRef.current) {
        chatSessionRef.current = ai.chats.create({
            model: 'gemini-3-pro-preview',
            config: {
                systemInstruction: "You are a helpful, context-aware AI assistant capable of drafting documents, troubleshooting, and answering complex questions. Remember the details of our conversation.",
            }
        });
     }
     return chatSessionRef.current;
   };

   const sendMessage = async (text: string) => {
      if (!text.trim()) return;

      const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
      setMessages(prev => [...prev, userMsg]);
      setIsLoading(true);

      try {
         const chat = getChat();
         const result = await chat.sendMessageStream({ message: text });
         
         const modelMsgId = (Date.now() + 1).toString();
         setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', timestamp: Date.now() }]);

         let fullText = '';
         for await (const chunk of result) {
            const chunkText = (chunk as GenerateContentResponse).text;
            if (chunkText) {
                fullText += chunkText;
                setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: fullText } : m));
            }
         }
      } catch (e) {
         console.error(e);
         setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Error: Could not generate response. Please try again.', timestamp: Date.now() }]);
      } finally {
         setIsLoading(false);
      }
   }

   return { messages, sendMessage, isLoading };
}