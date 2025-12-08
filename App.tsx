
import React, { useState } from 'react';
import StepIndicator from './components/StepIndicator';
import Step1Lyrics from './components/Step1Lyrics';
import Step2Stories from './components/Step2Stories';
import Step3Characters from './components/Step3Characters';
import Step4Storyboard from './components/Step4Storyboard';
import Step5DetailedStoryboard from './components/Step5DetailedStoryboard';
import Step5ImagePrompts from './components/Step5ImagePrompts';
import Step6VideoPrompts from './components/Step6VideoPrompts';
import { Step, StoryOption, Character, Scene } from './types';

function App() {
  const [currentStep, setCurrentStep] = useState<Step>(Step.LYRICS);
  const [maxReachedStep, setMaxReachedStep] = useState<Step>(Step.LYRICS);

  // Global State
  const [lyrics, setLyrics] = useState('');
  const [stories, setStories] = useState<StoryOption[]>([]);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  
  // State for Step 4 (Base Storyboard)
  const [baseScenes, setBaseScenes] = useState<Scene[]>([]);
  // State for Step 5, 6, 7 (Detailed Storyboard & Prompts)
  const [detailedScenes, setDetailedScenes] = useState<Scene[]>([]);

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
      md += `## 2. Selected Story: ${s.title}\n\n`;
      md += `**Genre:** ${s.genre}\n`;
      md += `**Mood:** ${s.mood}\n`;
      md += `**Synopsis:**\n${s.synopsis}\n\n---\n\n`;
    }

    // 3. Characters
    if (characters.length > 0) {
      md += `## 3. Characters\n\n`;
      characters.forEach(c => {
        md += `### ${c.name} (${c.role})\n`;
        md += `- **Visual:** ${c.visualDescription}\n`;
        md += `- **Personality:** ${c.personality}\n`;
        md += `- **Outfit:** ${c.outfit}\n\n`;
      });
      md += `---\n\n`;
    }

    // 4. Base Storyboard
    if (baseScenes.length > 0) {
      md += `## 4. Base Storyboard\n\n`;
      baseScenes.forEach(s => {
        md += `### Scene ${s.sceneNumber} (${s.estimatedDuration})\n`;
        md += `- **Action:** ${s.visualAction}\n`;
        md += `- **Mood:** ${s.moodAndLighting}\n`;
        md += `- **Camera:** ${s.cameraMovement}\n`;
        md += `- **Lyrics:** ${s.lyricsSegment}\n\n`;
      });
      md += `---\n\n`;
    }

    // 5. Detailed Storyboard & Prompts
    if (detailedScenes.length > 0) {
       md += `## 5-7. Detailed Storyboard & Prompts (Shooting Script)\n\n`;
       detailedScenes.forEach(s => {
         md += `### Cut ${s.sceneNumber} (${s.estimatedDuration})\n`;
         md += `- **Action:** ${s.visualAction}\n`;
         md += `- **Mood:** ${s.moodAndLighting}\n`;
         md += `- **Camera:** ${s.cameraMovement}\n`;
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
        // Step 5 takes baseScenes as input and generates detailedScenes
        return (
          <Step5DetailedStoryboard
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
        // Step 6 works on detailedScenes
        return (
          <Step5ImagePrompts
            story={stories[selectedStoryIndex]}
            scenes={detailedScenes}
            setScenes={setDetailedScenes}
            onNext={nextStep}
            onDownloadFull={handleDownloadFull}
          />
        );
      case Step.VIDEO_PROMPTS:
        // Step 7 works on detailedScenes
        return (
          <Step6VideoPrompts
            scenes={detailedScenes}
            setScenes={setDetailedScenes}
            onDownloadFull={handleDownloadFull}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-slate-950 text-slate-100">
      <StepIndicator
        currentStep={currentStep}
        setStep={handleStepChange}
        maxReachedStep={maxReachedStep}
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Background Ambient Effect */}
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
