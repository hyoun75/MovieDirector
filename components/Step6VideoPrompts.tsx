
import React, { useState, useEffect } from 'react';
import { Scene } from '../types';
import { generateVideoPrompts } from '../services/geminiService';
import { Film, RefreshCw, Copy, Check, Download, FileText } from 'lucide-react';

interface Step6VideoPromptsProps {
  scenes: Scene[];
  setScenes: (scenes: Scene[]) => void;
  onDownloadFull: () => void;
}

const Step6VideoPrompts: React.FC<Step6VideoPromptsProps> = ({
  scenes,
  setScenes,
  onDownloadFull
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const fetchPrompts = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await generateVideoPrompts(scenes);
      setScenes(result);
    } catch (err) {
      setError('동영상 프롬프트를 생성하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scenes.length > 0 && !scenes[0].videoPrompt) {
      fetchPrompts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownload = () => {
    let md = `# Video Generation Prompts\n\n`;
    scenes.forEach(s => {
      md += `## Scene ${s.sceneNumber}\n`;
      md += `> ${s.videoPrompt}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'video_prompts.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px]">
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-6 text-xl text-slate-300 font-medium">카메라 무빙과 모션을 포함한 영상 프롬프트를 작성 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <span className="text-indigo-400">#7</span> 동영상 프롬프트 (완료)
          </h2>
          <p className="text-slate-400 mt-1">Sora, Veo, Runway 등에서 사용할 수 있는 영상 생성 프롬프트입니다.</p>
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
            title="Download Video Prompts Only"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={fetchPrompts}
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
          <div key={index} className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 hover:bg-slate-800/60 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                 <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded">Scene {scene.sceneNumber}</span>
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Image Prompt Display (Read-only reference) */}
               <div className="bg-slate-900/30 rounded-lg border border-slate-800/50 p-4 opacity-70">
                 <h4 className="text-xs uppercase font-semibold text-slate-500 mb-2">Image Prompt (Ref)</h4>
                 <p className="text-slate-400 text-xs line-clamp-4">{scene.imagePrompt}</p>
               </div>

               {/* Video Prompt */}
               <div className="relative bg-indigo-900/10 rounded-lg border border-indigo-500/30 p-4 group">
                  <h4 className="text-xs uppercase font-semibold text-indigo-400 mb-2 flex items-center gap-1">
                    <Film className="w-3 h-3" /> Video Prompt
                  </h4>
                  <p className="text-indigo-100 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                    {scene.videoPrompt || "Prompt generation failed."}
                  </p>
                  
                  {scene.videoPrompt && (
                    <button
                      onClick={() => copyToClipboard(scene.videoPrompt!, index)}
                      className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      title="Copy Video Prompt"
                    >
                      {copiedIndex === index ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
               </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-center">
         <p className="text-slate-500 text-sm">모든 과정이 완료되었습니다! 언제든지 이전 단계를 클릭하여 내용을 수정할 수 있습니다.</p>
      </div>
    </div>
  );
};

export default Step6VideoPrompts;
