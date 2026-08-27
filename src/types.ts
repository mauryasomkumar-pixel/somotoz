export interface AIReflectionResponse {
  title: string;
  conversationalReply: string;
  moodTags: string[];
  actionableTakeaways: string[];
}

export type GenerationMode = 'text' | 'image' | 'video' | 'music';

export interface ChatMediaData {
  type: GenerationMode;
  url?: string;
  svgData?: string;
  prompt?: string;
  aspectRatio?: string;
  duration?: string;
  audioNotes?: Array<{ freq: number; duration: number; type?: OscillatorType }>;
  tempo?: number;
  genre?: string;
  videoFrames?: string[];
  animationType?: 'ambient_pulse' | 'cyber_wave' | 'neural_mesh' | 'cosmic_drift';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  mode?: GenerationMode;
  media?: ChatMediaData;
  sources?: { title: string; uri: string }[];
  modelUsed?: string;
}

export type ChatRole = 'ai_engineer' | 'empathetic_listener' | 'cognitive_reframer' | 'socratic_guide' | 'mindfulness_coach';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  aiResponse?: AIReflectionResponse | null;
  moodTags: string[];
  createdAt: number; // Unix timestamp in ms for consistent UI/sorting
  updatedAt?: number;
  wordCount: number;
  isFavorite?: boolean;
  artworkData?: string | null; // Base64 or generated SVG data URI for visual mood art
  artworkPrompt?: string | null;
  chatThread?: ChatMessage[];
  transcribedAudio?: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export type ViewMode = 'write' | 'view' | 'edit' | 'chat' | 'wisdom' | 'soundscapes';


