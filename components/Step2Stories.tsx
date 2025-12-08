
import React, { useState, useEffect, useRef } from 'react';
import { StoryOption } from '../types';
import { generateStories } from '../services/geminiService';
import { Sparkles, RefreshCw, CheckCircle2, Languages, Download, Plus, Upload, X, FileText } from 'lucide-react';

interface Step2StoriesProps {
  lyrics: string;
  stories: StoryOption[];
  selectedStoryIndex: number | null;
  setStories: (stories: StoryOption[]) => void;
  setSelectedStoryIndex: (index: number) => void;
  onNext: () => void;
  onDownloadFull: () => void;
}

const Step2Stories: React.FC<Step2StoriesProps> = ({ 
  lyrics, 
  stories, 
  selectedStoryIndex, 
  setStories, 
  setSelectedStoryIndex, 
  onNext,
  onDownloadFull
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const [showCustomForm, setShowCustomForm] = useState(false);
  
  // Custom form state
  const [customTitle, setCustomTitle] = useState('');
  const [customGenre, setCustomGenre] = useState('');
  const [customMood, setCustomMood] = useState('');
  const [customSynopsis, setCustomSynopsis] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStories = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await generateStories(lyrics);
      // Append new stories instead of replacing
      setStories([...stories, ...result]);
      if (stories.length === 0) {
        setSelectedStoryIndex(-1); // Reset selection only if it was empty
      }
    } catch (err) {
      setError('스토리를 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only generate if we don't have stories yet
    if (stories.length === 0) {
      fetchStories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update displayed fields when language changes
  useEffect(() => {
    const updatedStories = stories.map(story => ({
      ...story,
      title: lang === 'ko' ? (story.title_ko || story.title) : (story.title_en || story.title),
      synopsis: lang === 'ko' ? (story.synopsis_ko || story.synopsis) : (story.synopsis_en || story.synopsis),
      genre: lang === 'ko' ? (story.genre_ko || story.genre) : (story.genre_en || story.genre),
      mood: lang === 'ko' ? (story.mood_ko || story.mood) : (story.mood_en || story.mood),
    }));
  }, [lang]);

  const updateStoriesLanguage = (targetLang: 'ko' | 'en') => {
    const updated = stories.map(s => ({
      ...s,
      title: targetLang === 'ko' ? (s.title_ko || s.title) : (s.title_en || s.title),
      synopsis: targetLang === 'ko' ? (s.synopsis_ko || s.synopsis) : (s.synopsis_en || s.synopsis),
      genre: targetLang === 'ko' ? (s.genre_ko || s.genre) : (s.genre_en || s.genre),
      mood: targetLang === 'ko' ? (s.mood_ko || s.mood) : (s.mood_en || s.mood),
    }));
    setStories(updated);
    setLang(targetLang);
  };

  const handleDownloadMarkdown = () => {
    let mdContent = `# Music Video Story Concepts\n\nGenerated for Lyrics:\n> ${lyrics.replace(/\n/g, '\n> ').substring(0, 200)}...\n\n---\n\n`;

    stories.forEach((story, idx) => {
      mdContent += `## Story ${idx + 1}: ${story.title}\n\n`;
      mdContent += `**Genre:** ${story.genre}\n`;
      mdContent += `**Mood:** ${story.mood}\n\n`;
      mdContent += `**Synopsis:**\n${story.synopsis}\n\n`;
      mdContent += `---\n\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mv_stories.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddCustomStory = () => {
    if (!customTitle || !customSynopsis) return;
    
    const newStory: StoryOption = {
      title: customTitle,
      genre: customGenre || 'Custom',
      mood: customMood || 'Custom',
      synopsis: customSynopsis,
      // For custom stories, we use the same text for both langs unless user provides (simplified here)
      title_ko: customTitle,
      title_en: customTitle,
      genre_ko: customGenre || 'Custom',
      genre_en: customGenre || 'Custom',
      synopsis_ko: customSynopsis,
      synopsis_en: customSynopsis,
      mood_ko: customMood || 'Custom',
      mood_en: customMood || 'Custom'
    };
    
    setStories([...stories, newStory]);
    setCustomTitle('');
    setCustomGenre('');
    setCustomMood('');
    setCustomSynopsis('');
    setShowCustomForm(false);
    
    // Select the new story
    setSelectedStoryIndex(stories.length);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCustomSynopsis(text);
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 w-6 h-6 animate-pulse" />
        </div>
        <p className="mt-6 text-xl text-slate-300 font-medium">AI가 가사를 분석하여 4가지 스토리를 구상 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <span className="text-indigo-400">#2</span> 스토리 선택
          </h2>
          <p className="text-slate-400 mt-1">가장 마음에 드는 뮤직비디오 컨셉을 선택해주세요.</p>
        </div>
        <div className="flex gap-2">
           <button
            onClick={() => updateStoriesLanguage(lang === 'ko' ? 'en' : 'ko')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors border border-slate-700"
            title="Switch Language"
          >
            <Languages className="w-4 h-4" />
            <span className="text-sm font-medium">{lang === 'ko' ? 'EN' : '한글'}</span>
          </button>
          
          <button
            onClick={onDownloadFull}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-indigo-300 transition-colors border border-slate-700"
            title="Download Full Project"
          >
            <FileText className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors border border-slate-700"
            title="Download Stories Only"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={fetchStories}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors shadow-lg shadow-indigo-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            재생성 (+4)
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 mb-6 text-center">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-4 pr-2">
        {/* Custom Story Input Section */}
        {showCustomForm ? (
          <div className="mb-6 p-6 bg-slate-800 border border-slate-600 rounded-xl animate-fade-in">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold text-white">Custom Story</h3>
               <button onClick={() => setShowCustomForm(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input 
                  type="text" 
                  placeholder="Title" 
                  value={customTitle} 
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input 
                  type="text" 
                  placeholder="Genre" 
                  value={customGenre} 
                  onChange={(e) => setCustomGenre(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                 <input 
                  type="text" 
                  placeholder="Mood" 
                  value={customMood} 
                  onChange={(e) => setCustomMood(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
             </div>
             <div className="mb-4 relative">
                <textarea
                  placeholder="Synopsis (Paste text or upload file)"
                  value={customSynopsis}
                  onChange={(e) => setCustomSynopsis(e.target.value)}
                  className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
                <div className="absolute bottom-3 right-3">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".txt,.md" 
                    onChange={handleFileUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded border border-slate-600 transition-colors"
                  >
                    <Upload className="w-3 h-3" /> Upload File
                  </button>
                </div>
             </div>
             <div className="flex justify-end">
                <button 
                  onClick={handleAddCustomStory}
                  disabled={!customTitle || !customSynopsis}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Story
                </button>
             </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowCustomForm(true)}
            className="w-full py-3 mb-6 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition-all hover:bg-slate-800/30"
          >
            <Plus className="w-5 h-5 mr-2" /> 직접 스토리 입력하기
          </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stories.map((story, index) => (
            <div
              key={index}
              onClick={() => setSelectedStoryIndex(index)}
              className={`cursor-pointer group relative p-6 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] ${
                selectedStoryIndex === index
                  ? 'bg-indigo-900/20 border-indigo-500 shadow-xl shadow-indigo-500/20'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
              }`}
            >
              {selectedStoryIndex === index && (
                <div className="absolute top-4 right-4 text-indigo-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              )}
              <div className="mb-4">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
                  {story.genre}
                </span>
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                  {story.title}
                </h3>
                <p className="text-sm text-slate-400 italic">Mood: {story.mood}</p>
              </div>
              <p className="text-slate-300 leading-relaxed text-sm">
                {story.synopsis}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          disabled={selectedStoryIndex === null || selectedStoryIndex === -1}
          className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 ${
            selectedStoryIndex === null || selectedStoryIndex === -1
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-indigo-500/30'
          }`}
        >
          인물 생성하기 →
        </button>
      </div>
    </div>
  );
};

export default Step2Stories;
