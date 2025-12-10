
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

export const generateCustomStory = async (lyrics: string, keywords: string): Promise<StoryOption> => {
  checkApiKey();

  const responseSchema: Schema = {
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
  };

  const prompt = `
    Create a unique music video story concept based on the lyrics and the user's specific keywords.
    The story must align with the keywords provided.
    
    Lyrics: "${lyrics.substring(0, 1000)}..."
    User Keywords/Instruction: "${keywords}"
    
    IMPORTANT: Provide the content in BOTH Korean (_ko) and English (_en).
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
  if (!text) throw new Error("Failed to generate custom story");

  const s = JSON.parse(text);
  
  return {
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
  };
};

export const generateCharacters = async (story: StoryOption, lyrics: string): Promise<Character[]> => {
  checkApiKey();

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name_ko: { type: Type.STRING },
        name_en: { type: Type.STRING },
        role_ko: { type: Type.STRING },
        role_en: { type: Type.STRING },
        visualDescription_ko: { type: Type.STRING },
        visualDescription_en: { type: Type.STRING },
        personality_ko: { type: Type.STRING },
        personality_en: { type: Type.STRING },
        outfit_ko: { type: Type.STRING },
        outfit_en: { type: Type.STRING },
        keywords: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "3-5 key adjectives or nouns describing the character's vibe" 
        }
      },
      required: ["name_ko", "name_en", "role_ko", "role_en", "visualDescription_ko", "visualDescription_en", "personality_ko", "outfit_ko"]
    }
  };

  const prompt = `
    Create a list of main characters (1-3 main characters) for a music video based on this story concept.
    Also provide 3-5 keywords for each character that capture their aesthetic or vibe.
    
    IMPORTANT: Provide the content in BOTH Korean (_ko) and English (_en).
    
    Story Title: ${story.title_ko || story.title}
    Synopsis: ${story.synopsis_ko || story.synopsis}
    Mood: ${story.mood_ko || story.mood}
    
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
  const rawChars = JSON.parse(text) as any[];

  return rawChars.map(c => ({
    name: c.name_ko,
    role: c.role_ko,
    visualDescription: c.visualDescription_ko,
    personality: c.personality_ko,
    outfit: c.outfit_ko,
    keywords: c.keywords,
    // Bilingual
    name_ko: c.name_ko,
    name_en: c.name_en,
    role_ko: c.role_ko,
    role_en: c.role_en,
    visualDescription_ko: c.visualDescription_ko,
    visualDescription_en: c.visualDescription_en,
    personality_ko: c.personality_ko,
    personality_en: c.personality_en,
    outfit_ko: c.outfit_ko,
    outfit_en: c.outfit_en
  }));
};

export const regenerateCharacter = async (
  originalChar: Character,
  story: StoryOption,
  userInstruction: string,
  imageBase64?: string
): Promise<Character> => {
  checkApiKey();

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      name_ko: { type: Type.STRING },
      name_en: { type: Type.STRING },
      role_ko: { type: Type.STRING },
      role_en: { type: Type.STRING },
      visualDescription_ko: { type: Type.STRING },
      visualDescription_en: { type: Type.STRING },
      personality_ko: { type: Type.STRING },
      personality_en: { type: Type.STRING },
      outfit_ko: { type: Type.STRING },
      outfit_en: { type: Type.STRING },
      keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["name_ko", "role_ko", "visualDescription_ko", "personality_ko", "outfit_ko", "keywords"]
  };

  // Build the content parts
  const parts: any[] = [];

  // Add Image part if it exists (Vision capability)
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64
      }
    });
    parts.push({
      text: "Use this image as the primary visual reference for the character's appearance, outfit, and vibe."
    });
  }

  const keywordsString = originalChar.keywords ? originalChar.keywords.join(", ") : "";

  const promptText = `
    Update or Create a character profile for a music video.
    IMPORTANT: Provide the content in BOTH Korean (_ko) and English (_en).
    
    Story Context: ${story.title} - ${story.mood}
    
    Current Profile (if any):
    Name: ${originalChar.name}
    Role: ${originalChar.role}
    Visual: ${originalChar.visualDescription}
    Keywords: ${keywordsString}
    
    USER INSTRUCTION: "${userInstruction}"
    
    KEYWORD INSTRUCTION: Ensure the character embodies these keywords: [${keywordsString}]. 
    
    If an image is provided, ensure the visual description matches the image closely.
  `;

  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts: parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema
    }
  });

  const text = response.text;
  if (!text) return originalChar;
  
  const c = JSON.parse(text);
  return {
    name: c.name_ko,
    role: c.role_ko,
    visualDescription: c.visualDescription_ko,
    personality: c.personality_ko,
    outfit: c.outfit_ko,
    keywords: c.keywords,
    // Bilingual
    name_ko: c.name_ko,
    name_en: c.name_en,
    role_ko: c.role_ko,
    role_en: c.role_en,
    visualDescription_ko: c.visualDescription_ko,
    visualDescription_en: c.visualDescription_en,
    personality_ko: c.personality_ko,
    personality_en: c.personality_en,
    outfit_ko: c.outfit_ko,
    outfit_en: c.outfit_en
  };
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
        lyricsSegment: { type: Type.STRING },
        visualAction_ko: { type: Type.STRING },
        visualAction_en: { type: Type.STRING },
        moodAndLighting_ko: { type: Type.STRING },
        moodAndLighting_en: { type: Type.STRING },
        cameraMovement_ko: { type: Type.STRING },
        cameraMovement_en: { type: Type.STRING },
        estimatedDuration: { type: Type.STRING }
      },
      required: ["sceneNumber", "lyricsSegment", "visualAction_ko", "visualAction_en", "moodAndLighting_ko", "cameraMovement_ko", "estimatedDuration"]
    }
  };

  const prompt = `
    Create a detailed storyboard (8 to 12 scenes) for a music video.
    Match scenes to the lyrics progression.
    
    IMPORTANT: Provide visual action, mood, and camera movement in BOTH Korean (_ko) and English (_en).
    
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
  
  const rawScenes = JSON.parse(text) as any[];
  return rawScenes.map(s => ({
    sceneNumber: s.sceneNumber,
    lyricsSegment: s.lyricsSegment,
    estimatedDuration: s.estimatedDuration,
    // Defaults
    visualAction: s.visualAction_ko,
    moodAndLighting: s.moodAndLighting_ko,
    cameraMovement: s.cameraMovement_ko,
    // Bilingual
    visualAction_ko: s.visualAction_ko,
    visualAction_en: s.visualAction_en,
    moodAndLighting_ko: s.moodAndLighting_ko,
    moodAndLighting_en: s.moodAndLighting_en,
    cameraMovement_ko: s.cameraMovement_ko,
    cameraMovement_en: s.cameraMovement_en,
  }));
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
        visualAction_ko: { type: Type.STRING },
        visualAction_en: { type: Type.STRING },
        moodAndLighting_ko: { type: Type.STRING },
        moodAndLighting_en: { type: Type.STRING },
        cameraMovement_ko: { type: Type.STRING },
        cameraMovement_en: { type: Type.STRING },
        estimatedDuration: { type: Type.STRING, description: "Must be 5 seconds or less" }
      },
      required: ["sceneNumber", "lyricsSegment", "visualAction_ko", "visualAction_en", "moodAndLighting_ko", "cameraMovement_ko", "estimatedDuration"]
    }
  };

  const prompt = `
    You are a professional Music Video Editor and Director.
    Your task is to REGENERATE the "Base Storyboard" into a "Detailed Shooting Script" by splitting scenes into smaller cuts.
    
    IMPORTANT: Provide visual action, mood, and camera movement in BOTH Korean (_ko) and English (_en).
    
    CRITICAL RULES:
    1. **MAX DURATION**: Every single cut must be **5 seconds or less**.
    2. **SPLIT & REFINE**: If a base scene suggests a long action, break it down into multiple cuts.
    
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
  
  const rawScenes = JSON.parse(text) as any[];
  return rawScenes.map(s => ({
    sceneNumber: s.sceneNumber,
    lyricsSegment: s.lyricsSegment,
    estimatedDuration: s.estimatedDuration,
    // Defaults
    visualAction: s.visualAction_ko,
    moodAndLighting: s.moodAndLighting_ko,
    cameraMovement: s.cameraMovement_ko,
    // Bilingual
    visualAction_ko: s.visualAction_ko,
    visualAction_en: s.visualAction_en,
    moodAndLighting_ko: s.moodAndLighting_ko,
    moodAndLighting_en: s.moodAndLighting_en,
    cameraMovement_ko: s.cameraMovement_ko,
    cameraMovement_en: s.cameraMovement_en,
  }));
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
    `Scene ${s.sceneNumber} (${s.estimatedDuration}): Action: ${s.visualAction_en || s.visualAction}, Mood: ${s.moodAndLighting_en || s.moodAndLighting}`
  ).join('\n');

  const prompt = `
    Generate highly detailed AI image generation prompts for each scene in the storyboard.
    The style should be consistent with the story mood: ${story.mood}.
    
    Input scenes are short cuts (under 5s). Focus on the static visual quality.
    
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
        videoPrompt: { type: Type.STRING, description: "A detailed text-to-video prompt" }
      },
      required: ["sceneNumber", "videoPrompt"]
    }
  };

  const scenesContext = scenes.map(s => 
    `Scene ${s.sceneNumber} (${s.estimatedDuration}): Visual: ${s.visualAction_en || s.visualAction}, Camera: ${s.cameraMovement_en || s.cameraMovement}, Base Image Prompt: ${s.imagePrompt}`
  ).join('\n');

  const prompt = `
    Generate specific AI video generation prompts (like for Sora, Runway, or Veo) for each scene.
    These are short cuts (under 5s). Focus heavily on the MOTION, CAMERA MOVEMENT, and PHYSICS.
    
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
