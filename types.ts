
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
}

export interface Scene {
  sceneNumber: number;
  lyricsSegment: string; // The lyrics corresponding to this scene
  visualAction: string;
  moodAndLighting: string;
  cameraMovement: string;
  estimatedDuration: string;
  imagePrompt?: string; // Added in step 6
  videoPrompt?: string; // Added in step 7
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
