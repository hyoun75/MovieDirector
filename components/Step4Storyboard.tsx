
import React, { useState, useEffect } from 'react';
import { Character, Scene, StoryOption } from '../types';
import { generateStoryboard } from '../services/geminiService';
import { Clapperboard, RefreshCw, Clock, Video, Download, FileText } from 'lucide-react';

interface Step4StoryboardProps {
  lyrics: string;
  story: StoryOption;
  characters: Character[];
  scenes: Scene[];
  setScenes: (scenes: Scene[]) => void;
  onNext: () => void;
  onDownloadFull: () => void;
}

const Step4Storyboard: React.FC<Step4StoryboardProps> = ({
  lyrics,
  story,
  characters,
  scenes,
  setScenes,
  onNext,
  onDownloadFull
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStoryboard = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await generateStoryboard(lyrics, story, characters);
      setScenes(result);
    } catch (err) {
      setError('콘티를 생성하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scenes.length === 0) {
      fetchStoryboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = () => {
    let md = `# Storyboard for "${story.title}"\n\n`;
    scenes.forEach(s => {
      md += `## Scene ${s.sceneNumber} (${s.estimatedDuration})\n`;
      md += `- **Action:** ${s.visualAction}\n`;
      md += `- **Camera:** ${s.cameraMovement}\n`;
      md += `- **Mood:** ${s.moodAndLighting}\n`;
      md += `- **Lyrics:** ${s.lyricsSegment}\n\n`;
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'storyboard.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px]">
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-6 text-xl text-slate-300 font-medium">장면 하나하나를 구성하고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <span className="text-indigo-400">#4</span> 콘티 생성
          </h2>
          <p className="text-slate-400 mt-1">뮤직비디오의 흐름을 보여주는 장면 리스트입니다.</p>
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
            title="Download Storyboard Only"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={fetchStoryboard}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            재생성
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 mb-6">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-4 pr-2 space-y-4">
        {scenes.map((scene, index) => (
          <div key={index} className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden hover:bg-slate-800/60 transition-colors">
            <div className="flex flex-col md:flex-row">
              <div className="bg-slate-900/50 p-4 flex flex-col justify-center items-center w-full md:w-32 border-b md:border-b-0 md:border-r border-slate-700">
                <span className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">Scene</span>
                <span className="text-3xl font-bold text-white">{scene.sceneNumber}</span>
                <div className="flex items-center gap-1 mt-2 text-indigo-400 text-xs font-mono bg-indigo-500/10 px-2 py-0.5 rounded">
                  <Clock className="w-3 h-3" />
                  {scene.estimatedDuration}
                </div>
              </div>
              
              <div className="p-5 flex-1 space-y-3">
                <div className="flex items-start gap-3">
                   <div className="bg-indigo-500/10 p-2 rounded text-indigo-400 mt-0.5">
                     <Clapperboard className="w-5 h-5" />
                   </div>
                   <div className="flex-1">
                     <h4 className="text-sm font-semibold text-indigo-200 mb-1">Visual Action</h4>
                     <p className="text-slate-100">{scene.visualAction}</p>
                   </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-purple-500/10 p-2 rounded text-purple-400 mt-0.5">
                    <Video className="w-5 h-5" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Camera</h4>
                      <p className="text-slate-300 text-sm">{scene.cameraMovement}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Mood & Lighting</h4>
                      <p className="text-slate-300 text-sm">{scene.moodAndLighting}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-2 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                  <p className="text-slate-400 text-sm italic">
                    <span className="text-slate-500 font-semibold not-italic mr-2">♪ Lyrics:</span>
                    "{scene.lyricsSegment}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          className="px-8 py-3 rounded-lg font-semibold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-indigo-500/30 hover:scale-105 transition-all"
        >
          이미지 프롬프트 생성하기 →
        </button>
      </div>
    </div>
  );
};

export default Step4Storyboard;
