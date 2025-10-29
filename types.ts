
import type { Chat } from "@google/genai";

export interface MeditationSession {
  script: string;
  imageUrl: string;
  audioData: string; // base64 encoded
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: GroundingSource[];
}

export type View = 'generator' | 'player' | 'chat';

export type Language = 'en' | 'fr' | 'es';

export interface UseAudioPlayerReturn {
  isPlaying: boolean;
  togglePlayPause: () => void;
  isLoading: boolean;
  error: string | null;
}
