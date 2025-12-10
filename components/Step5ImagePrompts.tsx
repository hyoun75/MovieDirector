
import React, { useState, useEffect } from 'react';
import { Scene, StoryOption, getLocalized } from '../types';
import { generateImagePrompts } from '../services/geminiService';
import { Image, RefreshCw, Copy, Check, Download, FileText, Command } from 'lucide-react';

interface Step5ImagePromptsProps {
  lang: 'ko' | 'en';
  story: StoryOption;
  scenes: Scene[];
  setScenes: (scenes: Scene[]) => void;
  onNext: () => void;
  onDownloadFull: () => void;
}

const Step5ImagePrompts: React.FC<Step5ImagePromptsProps> = ({
  lang,
  story,
  scenes,
  setScenes,
  onNext,
  onDownloadFull
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedHelper, setCopiedHelper] = useState<string | null>(null);

  const fetchPrompts = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await generateImagePrompts(scenes, story);
      setScenes(result);
    } catch (err) {
      setError(lang === 'ko' ? '이미지 프롬프트를 생성하는 중 오류가 발생했습니다.' : 'Error generating image prompts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scenes.length > 0 && !scenes[0].imagePrompt) {
      fetchPrompts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyHelperText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHelper(id);
    setTimeout(() => setCopiedHelper(null), 2000);
  };

  const handleDownload = () => {
    // 1. Download Markdown
    let md = `# Image Generation Prompts\n\n`;
    scenes.forEach(s => {
      md += `## Scene ${s.sceneNumber}\n`;
      md += `> ${s.imagePrompt}\n\n`;
    });

    const blobMd = new Blob([md], { type: 'text/markdown' });
    const urlMd = URL.createObjectURL(blobMd);
    const aMd = document.createElement('a');
    aMd.href = urlMd;
    aMd.download = 'image_prompts.md';
    document.body.appendChild(aMd);
    aMd.click();
    document.body.removeChild(aMd);
    URL.revokeObjectURL(urlMd);

    // 2. Download Numbered Text List (Plain Text)
    let txt = '';
    scenes.forEach((s, index) => {
      txt += `${index + 1}. ${s.imagePrompt || ''}\n`;
    });

    setTimeout(() => {
      const blobTxt = new Blob([txt], { type: 'text/plain' });
      const urlTxt = URL.createObjectURL(blobTxt);
      const aTxt = document.createElement('a');
      aTxt.href = urlTxt;
      aTxt.download = 'image_prompts_list.txt';
      document.body.appendChild(aTxt);
      aTxt.click();
      document.body.removeChild(aTxt);
      URL.revokeObjectURL(urlTxt);
    }, 100);
  };

  const HELPER_COMMAND_1 = "이 내용을 바탕으로 8개의 영화 스틸 컷 시퀀스를 생성해줘. 각 컷은 16:9의 비율을 가져야 해. 이 내용을 바탕으로 이미지를 생성해줘.";
  const HELPER_COMMAND_2 = "첫 프레임을 21:9의 이미지로 추출해줘";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px]">
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-6 text-xl text-slate-300 font-medium">
          {lang === 'ko' ? '각 장면을 위한 고화질 이미지 프롬프트를 작성 중입니다...' : 'Generating high-quality image prompts...'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <span className="text-indigo-400">#6</span> {lang === 'ko' ? '이미지 프롬프트' : 'Image Prompts'}
          </h2>
          <p className="text-slate-400 mt-1">
            {lang === 'ko' ? 'Midjourney나 Stable Diffusion에서 사용할 수 있는 프롬프트입니다.' : 'Prompts for Midjourney or Stable Diffusion.'}
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
            title="Download Image Prompts (MD + TXT)"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={fetchPrompts}
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
        {scenes.map((scene, index) => {
          const visual = getLocalized(scene, 'visualAction', lang);

          return (
            <div key={index} className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded">Scene {scene.sceneNumber}</span>
                  <span className="text-slate-400 text-sm font-normal truncate max-w-[300px]">{visual}</span>
                </h3>
              </div>
              
              <div className="relative bg-slate-950 rounded-lg border border-slate-800 p-4 group">
                 <div className="flex items-start gap-3">
                   <Image className="w-5 h-5 text-indigo-400 mt-1 flex-shrink-0" />
                   <p className="text-slate-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                     {scene.imagePrompt || "Prompt generation failed."}
                   </p>
                 </div>
                 
                 {scene.imagePrompt && (
                   <button
                     onClick={() => copyToClipboard(scene.imagePrompt!, index)}
                     className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                     title="Copy Prompt"
                   >
                     {copiedIndex === index ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                   </button>
                 )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 mb-2 bg-indigo-900/10 border border-indigo-500/20 rounded-xl p-4">
        <h3 className="text-sm font-bold text-indigo-300 mb-3 flex items-center gap-2">
          <Command className="w-4 h-4" />
          {lang === 'ko' ? 'AI 생성 도구 명령어 복사' : 'AI Generator Helper Commands'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => copyHelperText(HELPER_COMMAND_1, 'cmd1')}
            className="flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-xs text-left transition-colors group"
          >
            <span className="line-clamp-2 pr-2">{HELPER_COMMAND_1}</span>
            {copiedHelper === 'cmd1' ? (
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
            ) : (
              <Copy className="w-4 h-4 text-slate-500 group-hover:text-white flex-shrink-0" />
            )}
          </button>
          
          <button
            onClick={() => copyHelperText(HELPER_COMMAND_2, 'cmd2')}
            className="flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-xs text-left transition-colors group"
          >
            <span>{HELPER_COMMAND_2}</span>
            {copiedHelper === 'cmd2' ? (
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
            ) : (
              <Copy className="w-4 h-4 text-slate-500 group-hover:text-white flex-shrink-0" />
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={onNext}
          className="px-8 py-3 rounded-lg font-semibold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-indigo-500/30 hover:scale-105 transition-all"
        >
          {lang === 'ko' ? '동영상 프롬프트 생성하기 →' : 'Generate Video Prompts →'}
        </button>
      </div>
    </div>
  );
};

export default Step5ImagePrompts;
