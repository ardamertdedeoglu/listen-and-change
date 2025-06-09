// Common types for the Listen & Change application

export interface User {
  id: string;
  email: string;
  name?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  targetWords?: string[];
  replacementWords?: Record<string, string>;
  audioQuality?: 'low' | 'medium' | 'high';
  autoProcess?: boolean;
}

export interface AudioFile {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
  uploadedAt?: Date;
}

export interface TranscriptionWord {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface Transcription {
  text: string;
  words: TranscriptionWord[];
  duration?: number;
  source?: 'real' | 'mock' | string;
  language?: string;
  confidence?: number;
}

export interface WordReplacement {
  id: string;
  originalWord: string;
  replacementWord: string;
  position: number;
  startTime: number;
  endTime: number;
  suggestions: string[];
  selected: boolean;
  context?: string;
}

export interface ProcessedAudioFile {
  filename: string;
  path: string;
  downloadUrl: string;
  processedAt?: Date;
  replacements?: WordReplacement[];
}

export interface NLPWordFound {
  word: string;
  originalWord: string;
  position: number;
  targetWord: string;
  context: string;
}

export interface NLPSuggestion {
  originalWord: string;
  word: string;
  position: number;
  suggestions: string[];
  recommended: string;
  context: string;
}

export interface NLPSentiment {
  score: number;
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  positiveWords?: number;
  negativeWords?: number;
}

export interface NLPAnalysis {
  originalText: string;
  wordsFound: NLPWordFound[];
  suggestions: NLPSuggestion[];
  sentiment: NLPSentiment;
  wordCount: number;
  sentenceCount: number;
  analysis: {
    hasInappropriateContent: boolean;
    severity: 'none' | 'low' | 'medium' | 'high';
    recommendations: string[];
  };
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  success?: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface AudioProcessingOptions {
  quality?: 'low' | 'medium' | 'high';
  format?: 'wav' | 'mp3' | 'm4a';
  removeNoise?: boolean;
  normalizeVolume?: boolean;
}

// Error types
export interface AppError extends Error {
  code?: string;
  status?: number;
  details?: any;
}

// Component Props
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

// Audio player states
export type AudioPlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'error';

// Processing states
export type ProcessingState = 'idle' | 'uploading' | 'transcribing' | 'analyzing' | 'processing' | 'completed' | 'error';
