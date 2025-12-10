
import React, { useState, useEffect } from 'react';
import { Character, Scene, StoryOption, getLocalized } from '../types';
import { generateDetailedStoryboard } from '../services/geminiService';
import { Clapperboard, RefreshCw, Clock, Video, Scissors, Download, FileText } from 'lucide-react';

interface Step5DetailedStoryboardProps {
  lang: 'ko' | 'en';
  story: StoryOption;
  characters: Character[];
  baseScenes: Scene[];
  detailedScenes: Scene[];
  setDetailedScenes: (scenes: Scene[]) => void;
  onNext: () => void;
  onDownloadFull: () => void;
}

const Step5DetailedStoryboard: React.FC<Step5DetailedStoryboardProps> = ({
  lang,
  story,
  characters,
  baseScenes,
  detailedScenes,
  setDetailedScenes,
  onNext,
  onDownloadFull
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDetailedStoryboard = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await generateDetailedStoryboard(baseScenes, story, characters);
      setDetailedScenes(result);
    } catch (err) {
      setError(lang === 'ko' ? '세부 콘티를 생성하는 중 오류가 발생했습니다.' : 'Error generating detailed storyboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (detailedScenes.length === 0 && baseScenes.length > 0) {
      fetchDetailedStoryboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = () => {
    let md = `# Detailed Storyboard (Shooting Script) for "${getLocalized(story, 'title', lang)}"\n\n`;
    detailedScenes.forEach(s => {
      const visual = getLocalized(s, 'visualAction', lang);
      const mood = getLocalized(s, 'moodAndLighting', lang);
      const camera = getLocalized(s, 'cameraMovement', lang);
      
      md += `## Cut ${s.sceneNumber} (${s.estimatedDuration})\n`;
      md += `- **Action:** ${visual}\n`;
      md += `- **Camera:** ${camera}\n`;
      md += `- **Mood:** ${mood}\n`;
      if (s.lyricsSegment) md += `- **Lyrics:** ${s.lyricsSegment}\n`;
      md += `\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'detailed_storyboard.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px]">
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-6 text-xl text-slate-300 font-medium">
          {lang === 'ko' ? '콘티를 5초 단위의 짧은 컷으로 재생성하고 있습니다...' : 'Regenerating storyboard into short cuts...'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <span className="text-indigo-400">#5</span> {lang === 'ko' ? '세부 콘티 (5초 제한)' : 'Detailed Script (Max 5s)'}
          </h2>
          <p className="text-slate-400 mt-1">
            {lang === 'ko' ? '이전 단계의 콘티를 기반으로 5초 이하의 짧은 컷들로 재생성합니다.' : 'Splitting scenes into cuts under 5 seconds.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDownloadFull}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-indigo-300 transition-colors border border-slate-700"
            title="Download Full Project"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors border border-slate-700"
            title="Download Detailed Storyboard Only"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={fetchDetailedStoryboard}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {lang === 'ko' ? '재생성' : 'Regenerate'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 mb-6">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-4 pr-2 space-y-4">
        {detailedScenes.map((scene, index) => {
          const visual = getLocalized(scene, 'visualAction', lang);
          const mood = getLocalized(scene, 'moodAndLighting', lang);
          const camera = getLocalized(scene, 'cameraMovement', lang);

          return (
            <div key={index} className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden hover:bg-slate-800/60 transition-colors">
              <div className="flex flex-col md:flex-row">
                <div className="bg-slate-900/50 p-4 flex flex-col justify-center items-center w-full md:w-32 border-b md:border-b-0 md:border-r border-slate-700">
                  <span className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">Cut</span>
                  <span className="text-3xl font-bold text-white">{scene.sceneNumber}</span>
                  <div className={`flex items-center gap-1 mt-2 text-xs font-mono px-2 py-0.5 rounded ${
                     parseInt(scene.estimatedDuration) > 5 
                     ? 'bg-red-500/10 text-red-400' 
                     : 'bg-green-500/10 text-green-400'
                  }`}>
                    <Clock className="w-3 h-3" />
                    {scene.estimatedDuration}
                  </div>
                </div>
                
                <div className="p-5 flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                     <div className="bg-indigo-500/10 p-2 rounded text-indigo-400 mt-0.5">
                       <Scissors className="w-5 h-5" />
                     </div>
                     <div className="flex-1">
                       <h4 className="text-sm font-semibold text-indigo-200 mb-1">Detailed Action</h4>
                       <p className="text-slate-100">{visual}</p>
                     </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-purple-500/10 p-2 rounded text-purple-400 mt-0.5">
                      <Video className="w-5 h-5" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Camera</h4>
                        <p className="text-slate-300 text-sm">{camera}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Mood</h4>
                        <p className="text-slate-300 text-sm">{mood}</p>
                      </div>
                    </div>
                  </div>
                  
                  {scene.lyricsSegment && (
                    <div className="mt-2 bg-slate-900/50 p-2 rounded border border-slate-700/50 text-xs text-slate-400">
                      "{scene.lyricsSegment}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          className="px-8 py-3 rounded-lg font-semibold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-indigo-500/30 hover:scale-105 transition-all"
        >
          {lang === 'ko' ? '이미지 프롬프트 생성하기 →' : 'Generate Image Prompts →'}
        </button>
      </div>
    </div>
  );
};

export default Step5DetailedStoryboard;
