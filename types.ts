
export enum Step {
  LYRICS = 1,
  STORIES = 2,
  CHARACTERS = 3,
  STORYBOARD = 4,
  DETAILED_STORYBOARD = 5,
  IMAGE_PROMPTS = 6,
  VIDEO_PROMPTS = 7
}

export interface StoryOption {
  title: string;
  genre: string;
  synopsis: string;
  mood: string;
  // Bilingual support
  title_ko?: string;
  title_en?: string;
  genre_ko?: string;
  genre_en?: string;
  synopsis_ko?: string;
  synopsis_en?: string;
  mood_ko?: string;
  mood_en?: string;
}

export interface Character {
  name: string;
  role: string;
  visualDescription: string;
  personality: string;
  outfit: string;
  keywords?: string[]; 
  // Bilingual support
  name_ko?: string;
  name_en?: string;
  role_ko?: string;
  role_en?: string;
  visualDescription_ko?: string;
  visualDescription_en?: string;
  personality_ko?: string;
  personality_en?: string;
  outfit_ko?: string;
  outfit_en?: string;
}

export type AspectRatio = '21:9' | '16:9' | '1:1' | '9:16';
export type ImageModel = 'gemini-3-pro-image-preview' | 'gemini-2.5-flash-image';

export interface GeneratedImage {
  data: string; // base64
  mimeType: string;
}

export interface Scene {
  sceneNumber: number;
  lyricsSegment: string; 
  visualAction: string;
  moodAndLighting: string;
  cameraMovement: string;
  estimatedDuration: string;
  imagePrompt?: string; 
  videoPrompt?: string; 
  generatedImages?: GeneratedImage[];
  // Bilingual support
  visualAction_ko?: string;
  visualAction_en?: string;
  moodAndLighting_ko?: string;
  moodAndLighting_en?: string;
  cameraMovement_ko?: string;
  cameraMovement_en?: string;
}

export interface AppState {
  currentStep: Step;
  lyrics: string;
  stories: StoryOption[];
  selectedStoryIndex: number | null;
  characters: Character[];
  scenes: Scene[];
}

export const INITIAL_STATE: AppState = {
  currentStep: Step.LYRICS,
  lyrics: '',
  stories: [],
  selectedStoryIndex: null,
  characters: [],
  scenes: []
};

// Helper to get localized text
// Fallbacks: field_lang -> field -> empty string
export const getLocalized = (obj: any, field: string, lang: 'ko' | 'en'): string => {
  if (!obj) return '';
  const val = obj[`${field}_${lang}`];
  if (val) return val;
  // Fallback to the default field if localized one is missing
  return obj[field] || '';
};

declare global {
  // Define AIStudio interface to match existing global declaration and provide method types.
  // We do not redeclare 'aistudio' on Window here to avoid conflict with existing declarations
  // that specify it as type 'AIStudio'. Defining the interface guarantees the type shape.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}
