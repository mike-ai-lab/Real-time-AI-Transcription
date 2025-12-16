export enum LoadingState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  SPEAKING = 'SPEAKING',
}

export type LanguageMode = 'auto' | 'english' | 'arabic';

export interface DictationState {
  transcript: string;
  isRecording: boolean;
  error: string | null;
}

export interface SavedTranscript {
  id: string;
  content: string;
  createdAt: number;
  isFavorite: boolean;
}

// Minimal type definitions for what we expect from the Live API responses based on the provided guide
export interface LiveServerMessage {
  serverContent?: {
    modelTurn?: {
      parts: {
        inlineData: {
          mimeType: string;
          data: string;
        }
      }[]
    };
    turnComplete?: boolean;
    interrupted?: boolean;
    inputTranscription?: {
      text: string;
    };
    outputTranscription?: {
      text: string;
    };
  };
  toolCall?: {
    functionCalls: {
      name: string;
      id: string;
      args: any;
    }[];
  };
}