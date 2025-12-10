
import React, { useState, useEffect } from 'react';
import StepIndicator from './components/StepIndicator';
import Step1Lyrics from './components/Step1Lyrics';
import Step2Stories from './components/Step2Stories';
import Step3Characters from './components/Step3Characters';
import Step4Storyboard from './components/Step4Storyboard';
import Step5DetailedStoryboard from './components/Step5DetailedStoryboard';
import Step5ImagePrompts from './components/Step5ImagePrompts';
import Step6VideoPrompts from './components/Step6VideoPrompts';
import { Step, StoryOption, Character, Scene } from './types';
import { KeyRound, Sparkles } from 'lucide-react';

function App() {
  // API Key State
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);

  // App State
  const [currentStep, setCurrentStep] = useState<Step>(Step.LYRICS);
  const [maxReachedStep, setMaxReachedStep] = useState<Step>(Step.LYRICS);
  const [lang, setLang] = useState<'ko' | 'en'>('ko');

  // Global Content State
  const [lyrics, setLyrics] = useState('');
  const [stories, setStories] = useState<StoryOption[]>([]);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  
  // State for Step 4 (Base Storyboard)
  const [baseScenes, setBaseScenes] = useState<Scene[]>([]);
  // State for Step 5, 6, 7 (Detailed Storyboard & Prompts)
  const [detailedScenes, setDetailedScenes] = useState<Scene[]>([]);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        try {
          const has = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(has);
        } catch (e) {
          console.error("Failed to check API key:", e);
        }
      } else {
        // Fallback for dev environment without aistudio wrapper
        if (process.env.API_KEY) {
          setHasApiKey(true);
        }
      }
      setIsCheckingKey(false);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        // Assuming success to avoid race condition
        setHasApiKey(true);
      } catch (e) {
        console.error("Failed to select API key:", e);
      }
    }
  };

  // Navigation Handlers
  const handleStepChange = (step: Step) => {
    setCurrentStep(step);
    if (step > maxReachedStep) {
      setMaxReachedStep(step);
    }
  };

  const nextStep = () => {
    const next = currentStep + 1;
    handleStepChange(next);
  };

  // Generate Full Markdown
  const generateFullMarkdown = () => {
    let md = `# MV Director AI Project\n\n`;
    const date = new Date().toLocaleString();
    md += `**Date:** ${date}\n\n`;

    // 1. Lyrics
    if (lyrics) {
      md += `## 1. Lyrics\n\n${lyrics}\n\n---\n\n`;
    }

    // 2. Selected Story
    if (selectedStoryIndex !== null && stories[selectedStoryIndex]) {
      const s = stories[selectedStoryIndex];
      const title = lang === 'ko' ? (s.title_ko || s.title) : (s.title_en || s.title);
      const genre = lang === 'ko' ? (s.genre_ko || s.genre) : (s.genre_en || s.genre);
      const synopsis = lang === 'ko' ? (s.synopsis_ko || s.synopsis) : (s.synopsis_en || s.synopsis);
      
      md += `## 2. Selected Story: ${title}\n\n`;
      md += `**Genre:** ${genre}\n`;
      md += `**Mood:** ${lang === 'ko' ? (s.mood_ko || s.mood) : (s.mood_en || s.mood)}\n`;
      md += `**Synopsis:**\n${synopsis}\n\n---\n\n`;
    }

    // 3. Characters
    if (characters.length > 0) {
      md += `## 3. Characters\n\n`;
      characters.forEach(c => {
        const name = lang === 'ko' ? (c.name_ko || c.name) : (c.name_en || c.name);
        const role = lang === 'ko' ? (c.role_ko || c.role) : (c.role_en || c.role);
        const visual = lang === 'ko' ? (c.visualDescription_ko || c.visualDescription) : (c.visualDescription_en || c.visualDescription);
        const personality = lang === 'ko' ? (c.personality_ko || c.personality) : (c.personality_en || c.personality);
        const outfit = lang === 'ko' ? (c.outfit_ko || c.outfit) : (c.outfit_en || c.outfit);

        md += `### ${name} (${role})\n`;
        md += `- **Visual:** ${visual}\n`;
        md += `- **Personality:** ${personality}\n`;
        md += `- **Outfit:** ${outfit}\n\n`;
      });
      md += `---\n\n`;
    }

    // 4. Base Storyboard
    if (baseScenes.length > 0) {
      md += `## 4. Base Storyboard\n\n`;
      baseScenes.forEach(s => {
        const visual = lang === 'ko' ? (s.visualAction_ko || s.visualAction) : (s.visualAction_en || s.visualAction);
        const mood = lang === 'ko' ? (s.moodAndLighting_ko || s.moodAndLighting) : (s.moodAndLighting_en || s.moodAndLighting);
        const camera = lang === 'ko' ? (s.cameraMovement_ko || s.cameraMovement) : (s.cameraMovement_en || s.cameraMovement);

        md += `### Scene ${s.sceneNumber} (${s.estimatedDuration})\n`;
        md += `- **Action:** ${visual}\n`;
        md += `- **Mood:** ${mood}\n`;
        md += `- **Camera:** ${camera}\n`;
        md += `- **Lyrics:** ${s.lyricsSegment}\n\n`;
      });
      md += `---\n\n`;
    }

    // 5. Detailed Storyboard & Prompts
    if (detailedScenes.length > 0) {
       md += `## 5-7. Detailed Storyboard & Prompts (Shooting Script)\n\n`;
       detailedScenes.forEach(s => {
         const visual = lang === 'ko' ? (s.visualAction_ko || s.visualAction) : (s.visualAction_en || s.visualAction);
         const mood = lang === 'ko' ? (s.moodAndLighting_ko || s.moodAndLighting) : (s.moodAndLighting_en || s.moodAndLighting);
         const camera = lang === 'ko' ? (s.cameraMovement_ko || s.cameraMovement) : (s.cameraMovement_en || s.cameraMovement);

         md += `### Cut ${s.sceneNumber} (${s.estimatedDuration})\n`;
         md += `- **Action:** ${visual}\n`;
         md += `- **Mood:** ${mood}\n`;
         md += `- **Camera:** ${camera}\n`;
         if (s.imagePrompt) {
           md += `\n**Image Prompt:**\n> ${s.imagePrompt}\n`;
         }
         if (s.videoPrompt) {
           md += `\n**Video Prompt:**\n> ${s.videoPrompt}\n`;
         }
         md += `\n`;
       });
       md += `---\n\n`;
    }

    return md;
  };

  const handleDownloadFull = () => {
    const md = generateFullMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MV_Project_Full.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    switch (currentStep) {
      case Step.LYRICS:
        return (
          <Step1Lyrics
            lyrics={lyrics}
            setLyrics={setLyrics}
            onNext={nextStep}
            onDownloadFull={handleDownloadFull}
          />
        );
      case Step.STORIES:
        return (
          <Step2Stories
            lang={lang}
            lyrics={lyrics}
            stories={stories}
            selectedStoryIndex={selectedStoryIndex}
            setStories={setStories}
            setSelectedStoryIndex={setSelectedStoryIndex}
            onNext={nextStep}
            onDownloadFull={handleDownloadFull}
          />
        );
      case Step.CHARACTERS:
        if (selectedStoryIndex === null || !stories[selectedStoryIndex]) {
          return <div className="text-red-400">Error: No story selected. Please go back.</div>;
        }
        return (
          <Step3Characters
            lang={lang}
            lyrics={lyrics}
            story={stories[selectedStoryIndex]}
            characters={characters}
            setCharacters={setCharacters}
            onNext={nextStep}
            onDownloadFull={handleDownloadFull}
          />
        );
      case Step.STORYBOARD:
        if (selectedStoryIndex === null) return null;
        return (
          <Step4Storyboard
            lang={lang}
            lyrics={lyrics}
            story={stories[selectedStoryIndex]}
            characters={characters}
            scenes={baseScenes}
            setScenes={setBaseScenes}
            onNext={nextStep}
            onDownloadFull={handleDownloadFull}
          />
        );
      case Step.DETAILED_STORYBOARD:
        if (selectedStoryIndex === null) return null;
        return (
          <Step5DetailedStoryboard
            lang={lang}
            story={stories[selectedStoryIndex]}
            characters={characters}
            baseScenes={baseScenes}
            detailedScenes={detailedScenes}
            setDetailedScenes={setDetailedScenes}
            onNext={nextStep}
            onDownloadFull={handleDownloadFull}
          />
        );
      case Step.IMAGE_PROMPTS:
        if (selectedStoryIndex === null) return null;
        return (
          <Step5ImagePrompts
            lang={lang}
            story={stories[selectedStoryIndex]}
            scenes={detailedScenes}
            setScenes={setDetailedScenes}
            onNext={nextStep}
            onDownloadFull={handleDownloadFull}
          />
        );
      case Step.VIDEO_PROMPTS:
        return (
          <Step6VideoPrompts
            lang={lang}
            scenes={detailedScenes}
            setScenes={setDetailedScenes}
            onDownloadFull={handleDownloadFull}
          />
        );
      default:
        return null;
    }
  };

  if (isCheckingKey) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        Initializing...
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-8 rounded-2xl border border-indigo-500/30 max-w-md w-full shadow-2xl">
          <div className="bg-indigo-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-indigo-500/20">
             <KeyRound className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">API Key Required</h1>
          <p className="text-slate-400 mb-8">
            To generate music video storyboards and images using advanced Gemini models, please select your Google Cloud API key.
          </p>
          <button
            onClick={handleSelectKey}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Select API Key
          </button>
          <p className="mt-4 text-xs text-slate-600">
            Ensure your project has billing enabled for Imagen & Veo usage.
          </p>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline mt-2 inline-block">
            View Billing Documentation
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-slate-950 text-slate-100">
      <StepIndicator
        currentStep={currentStep}
        setStep={handleStepChange}
        maxReachedStep={maxReachedStep}
        lang={lang}
        setLang={setLang}
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px]"></div>
          <div className="absolute top-[40%] -left-[10%] w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="flex-1 p-6 lg:p-12 overflow-hidden">
          <div className="max-w-6xl mx-auto h-full bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden flex flex-col">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
