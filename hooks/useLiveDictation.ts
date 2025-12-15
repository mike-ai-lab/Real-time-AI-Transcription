import { useState, useRef, useCallback, useEffect } from 'react';
import { ai } from '../services/geminiService';
import { createPcmBlob } from '../utils/audioUtils';
import { LiveServerMessage, Modality } from '@google/genai';

interface UseLiveDictationProps {
  onTranscriptionUpdate: (text: string, isFinal: boolean) => void;
  onError: (error: string) => void;
}

export const useLiveDictation = ({ onTranscriptionUpdate, onError }: UseLiveDictationProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // For visualization
  
  // Refs to maintain state across async callbacks and avoid closure staleness
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  
  // Transcription state refs
  const currentTranscriptionRef = useRef('');

  const stop = useCallback(async () => {
    setIsRecording(false);
    setAudioLevel(0);

    // Close media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Disconnect script processor
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    // Close audio context
    if (inputAudioContextRef.current) {
      await inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }

    // Close session
    if (sessionPromiseRef.current) {
      const session = await sessionPromiseRef.current;
      // There is no explicit close() on the session object returned by connect in the JS SDK snippet,
      // but we should stop sending data. Ideally, we would close the socket if exposed.
      // Based on docs, usually we just stop streaming.
      sessionPromiseRef.current = null;
    }
    
    // Finalize any remaining text
    if (currentTranscriptionRef.current) {
        onTranscriptionUpdate(currentTranscriptionRef.current, true);
        currentTranscriptionRef.current = '';
    }
  }, [onTranscriptionUpdate]);

  const start = useCallback(async () => {
    try {
      setIsRecording(true);
      currentTranscriptionRef.current = '';

      // Initialize Audio Context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
      inputAudioContextRef.current = inputAudioContext;

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Connect to Gemini Live
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Session Opened');
            
            // Setup Audio Processing only after connection opens
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              
              // Calculate audio level for visualizer
              let sum = 0;
              for(let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              setAudioLevel(rms);

              const pcmBlob = createPcmBlob(inputData);
              
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentTranscriptionRef.current += text;
              // Real-time update (not final yet)
              onTranscriptionUpdate(currentTranscriptionRef.current, false);
            }

            if (message.serverContent?.turnComplete) {
              // Turn is complete, finalize this chunk
              onTranscriptionUpdate(currentTranscriptionRef.current, true);
              currentTranscriptionRef.current = '';
            }
          },
          onerror: (error) => {
            console.error('Gemini Live Error:', error);
            onError('Connection error occurred.');
            stop();
          },
          onclose: () => {
            console.log('Gemini Live Session Closed');
            stop();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO], // Required by protocol even if we just want transcription mainly
          inputAudioTranscription: {}, // Enable Input Transcription!
          systemInstruction: "You are an expert transcriber. Your task is to transcribe speech to text accurately. Strict rules:\n1. Apply proper punctuation (periods, commas, question marks) and capitalization.\n2. Do NOT include filler words (um, uh, ah), stuttering, or tags like <noise>.\n3. Output clean, readable prose.",
        },
      });

    } catch (err: any) {
      console.error('Failed to start recording:', err);
      onError(err.message || 'Failed to access microphone or connect to API.');
      stop();
    }
  }, [onTranscriptionUpdate, onError, stop]);

  return {
    isRecording,
    audioLevel,
    start,
    stop,
  };
};