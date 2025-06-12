import { api } from "./api";

export interface AudioFile {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
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
  source?: string;
}

export interface WordReplacement {
  originalWord: string;
  replacementText: string;
  startTime: number;
  endTime: number;
}

export interface ProcessedAudio {
  filename: string;
  path: string;
  downloadUrl: string;
}

export interface NLPAnalysis {
  originalText: string;
  wordsFound: Array<{
    word: string;
    originalWord: string;
    position: number;
    targetWord: string;
    context: string;
  }>;
  suggestions: Array<{
    originalWord: string;
    word: string;
    position: number;
    suggestions: string[];
    recommended: string;
    context: string;
  }>;
  sentiment: {
    score: number;
    label: string;
    confidence: number;
    positiveWords: number;
    negativeWords: number;
  };
  wordCount: number;
  sentenceCount: number;
  analysis: {
    hasInappropriateContent: boolean;
    severity: string;
    recommendations: string[];
  };
}

export const audioService = {
  // Upload audio file
  async uploadAudio(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ file: AudioFile }> {
    return api.uploadFile("/audio/upload", file, onProgress);
  },

  // Convert speech to text
  async speechToText(
    filename: string
  ): Promise<{ transcription: Transcription; words: TranscriptionWord[] }> {
    return api.request("/audio/speech-to-text", {
      method: "POST",
      body: JSON.stringify({ filename }),
    });
  },

  // Analyze text for inappropriate words
  async analyzeText(
    text: string,
    targetWords?: string[],
    audioId?: string
  ): Promise<{ analysis: NLPAnalysis; wordsFound: any[]; suggestions: any[] }> {
    return api.request("/audio/analyze-text", {
      method: "POST",
      body: JSON.stringify({ text, targetWords, audioId }),
    });
  },

  // Process audio with word replacements
  async processAudio(
    filename: string,
    replacements: WordReplacement[]
  ): Promise<{ message: string; processedFile: string; downloadUrl: string }> {
    return api.request("/audio/process-audio", {
      method: "POST",
      body: JSON.stringify({ filename, replacements }),
    });
  },

  // Get download URL for processed audio
  getDownloadUrl(filename: string): string {
    return `${api.baseURL}/audio/download/${filename}`;
  },

  // Get audio file info
  async getAudioInfo(
    filename: string
  ): Promise<{
    filename: string;
    size: number;
    created: string;
    modified: string;
  }> {
    return api.request(`/audio/info/${filename}`);
  },
};
