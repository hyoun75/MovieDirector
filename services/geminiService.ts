
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StoryOption, Character, Scene } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = 'gemini-2.5-flash';

// Helper to validate API key
const checkApiKey = () => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }
};

export const generateStories = async (lyrics: string): Promise<StoryOption[]> => {
  checkApiKey();
  
  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title_ko: { type: Type.STRING },
        title_en: { type: Type.STRING },
        genre_ko: { type: Type.STRING },
        genre_en: { type: Type.STRING },
        synopsis_ko: { type: Type.STRING },
        synopsis_en: { type: Type.STRING },
        mood_ko: { type: Type.STRING },
        mood_en: { type: Type.STRING }
      },
      required: ["title_ko", "title_en", "genre_ko", "genre_en", "synopsis_ko", "synopsis_en", "mood_ko", "mood_en"]
    }
  };

  const prompt = `
    Based on the following song lyrics, generate 4 distinct music video story concepts.
    Each concept should have a unique artistic direction (e.g., Narrative, Abstract, Performance-based, Cinematic).
    
    IMPORTANT: Provide the content in BOTH Korean (_ko) and English (_en).
    The Korean version should be natural and creative.
    
    Lyrics:
    "${lyrics}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are a creative Music Video Director. Output JSON only."
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const rawStories = JSON.parse(text) as any[];
    
    // Map to StoryOption, defaulting main fields to Korean
    return rawStories.map(s => ({
      title: s.title_ko,
      genre: s.genre_ko,
      synopsis: s.synopsis_ko,
      mood: s.mood_ko,
      title_ko: s.title_ko,
      title_en: s.title_en,
      genre_ko: s.genre_ko,
      genre_en: s.genre_en,
      synopsis_ko: s.synopsis_ko,
      synopsis_en: s.synopsis_en,
      mood_ko: s.mood_ko,
      mood_en: s.mood_en
    }));
  } catch (error) {
    console.error("Error generating stories:", error);
    throw error;
  }
};

export const generateCharacters = async (story: StoryOption, lyrics: string): Promise<Character[]> => {
  checkApiKey();

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        role: { type: Type.STRING },
        visualDescription: { type: Type.STRING },
        personality: { type: Type.STRING },
        outfit: { type: Type.STRING }
      },
      required: ["name", "role", "visualDescription", "personality", "outfit"]
    }
  };

  const prompt = `
    Create a list of main characters (1-3 main characters) for a music video based on this story concept.
    
    Story Title: ${story.title}
    Synopsis: ${story.synopsis}
    Mood: ${story.mood}
    
    Lyrics Context: ${lyrics.substring(0, 200)}...
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema
    }
  });

  const text = response.text;
  if (!text) return [];
  return JSON.parse(text) as Character[];
};

export const generateStoryboard = async (
  lyrics: string,
  story: StoryOption,
  characters: Character[]
): Promise<Scene[]> => {
  checkApiKey();

  const characterContext = characters.map(c => `${c.name} (${c.role}): ${c.visualDescription}`).join('\n');

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        sceneNumber: { type: Type.INTEGER },
        lyricsSegment: { type: Type.STRING, description: "The specific line(s) of lyrics this scene covers" },
        visualAction: { type: Type.STRING, description: "What happens in the scene visually" },
        moodAndLighting: { type: Type.STRING },
        cameraMovement: { type: Type.STRING },
        estimatedDuration: { type: Type.STRING }
      },
      required: ["sceneNumber", "lyricsSegment", "visualAction", "moodAndLighting", "cameraMovement", "estimatedDuration"]
    }
  };

  const prompt = `
    Create a detailed storyboard (8 to 12 scenes) for a music video.
    Match scenes to the lyrics progression.
    
    Story: ${story.title} - ${story.synopsis}
    Characters: ${characterContext}
    
    Full Lyrics:
    ${lyrics}
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema
    }
  });

  const text = response.text;
  if (!text) return [];
  return JSON.parse(text) as Scene[];
};

export const generateDetailedStoryboard = async (
  baseScenes: Scene[],
  story: StoryOption,
  characters: Character[]
): Promise<Scene[]> => {
  checkApiKey();

  const characterContext = characters.map(c => `${c.name} (${c.role}): ${c.visualDescription}`).join('\n');
  const baseScenesContext = baseScenes.map(s => 
    `Base Scene ${s.sceneNumber} (${s.estimatedDuration}): ${s.visualAction} [Lyrics: ${s.lyricsSegment}]`
  ).join('\n');

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        sceneNumber: { type: Type.INTEGER },
        lyricsSegment: { type: Type.STRING },
        visualAction: { type: Type.STRING, description: "Specific, short visual action for this cut" },
        moodAndLighting: { type: Type.STRING },
        cameraMovement: { type: Type.STRING, description: "Dynamic camera move (e.g., Quick Zoom, Pan, Handheld)" },
        estimatedDuration: { type: Type.STRING, description: "Must be 5 seconds or less (e.g., '2s', '4.5s')" }
      },
      required: ["sceneNumber", "lyricsSegment", "visualAction", "moodAndLighting", "cameraMovement", "estimatedDuration"]
    }
  };

  const prompt = `
    You are a professional Music Video Editor and Director.
    Your task is to REGENERATE the "Base Storyboard" into a "Detailed Shooting Script" by splitting scenes into smaller cuts.
    
    CRITICAL RULES:
    1. **MAX DURATION**: Every single cut must be **5 seconds or less**.
    2. **SPLIT & REFINE**: If a base scene suggests a long action, break it down into multiple cuts (e.g., Wide shot -> Close up -> Reaction shot).
    3. **CONTINUITY**: The sequence of cuts must tell the same story as the base scene.
    4. **QUANTITY**: Expect to generate more scenes than the input (e.g., 8 base scenes -> 20 detailed cuts).
    
    Context:
    Story: ${story.title}
    Mood: ${story.mood}
    Characters: ${characterContext}
    
    Base Storyboard to Regenerate:
    ${baseScenesContext}
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema
    }
  });

  const text = response.text;
  if (!text) return baseScenes;
  return JSON.parse(text) as Scene[];
};

export const generateImagePrompts = async (scenes: Scene[], story: StoryOption): Promise<Scene[]> => {
  checkApiKey();

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        sceneNumber: { type: Type.INTEGER },
        imagePrompt: { type: Type.STRING, description: "A high-quality text-to-image prompt (Midjourney/Stable Diffusion style)" }
      },
      required: ["sceneNumber", "imagePrompt"]
    }
  };

  const scenesContext = scenes.map(s => 
    `Scene ${s.sceneNumber} (${s.estimatedDuration}): Action: ${s.visualAction}, Mood: ${s.moodAndLighting}`
  ).join('\n');

  const prompt = `
    Generate highly detailed AI image generation prompts for each scene in the storyboard.
    The style should be consistent with the story mood: ${story.mood}.
    Include details about lighting, camera angle, texture, and color palette.
    
    The scenes are short cuts (under 5s). Focus on the static visual quality of this specific moment.
    
    Scenes:
    ${scenesContext}
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema
    }
  });

  const text = response.text;
  if (!text) return scenes;
  
  const prompts = JSON.parse(text) as { sceneNumber: number, imagePrompt: string }[];
  
  return scenes.map(scene => {
    const match = prompts.find(p => p.sceneNumber === scene.sceneNumber);
    return match ? { ...scene, imagePrompt: match.imagePrompt } : scene;
  });
};

export const generateVideoPrompts = async (scenes: Scene[]): Promise<Scene[]> => {
  checkApiKey();

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        sceneNumber: { type: Type.INTEGER },
        videoPrompt: { type: Type.STRING, description: "A detailed text-to-video prompt focusing on motion and camera physics" }
      },
      required: ["sceneNumber", "videoPrompt"]
    }
  };

  const scenesContext = scenes.map(s => 
    `Scene ${s.sceneNumber} (${s.estimatedDuration}): Visual: ${s.visualAction}, Camera: ${s.cameraMovement}, Base Image Prompt: ${s.imagePrompt}`
  ).join('\n');

  const prompt = `
    Generate specific AI video generation prompts (like for Sora, Runway, or Veo) for each scene.
    These are short cuts (under 5s). Focus heavily on the MOTION, CAMERA MOVEMENT, and PHYSICS of the scene within that short timeframe.
    
    Scenes:
    ${scenesContext}
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema
    }
  });

  const text = response.text;
  if (!text) return scenes;
  
  const videoPrompts = JSON.parse(text) as { sceneNumber: number, videoPrompt: string }[];

  return scenes.map(scene => {
    const match = videoPrompts.find(p => p.sceneNumber === scene.sceneNumber);
    return match ? { ...scene, videoPrompt: match.videoPrompt } : scene;
  });
};
