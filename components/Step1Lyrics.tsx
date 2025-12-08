
import React from 'react';
import { Music, Download, FileText } from 'lucide-react';

interface Step1LyricsProps {
  lyrics: string;
  setLyrics: (lyrics: string) => void;
  onNext: () => void;
  onDownloadFull: () => void;
}

const Step1Lyrics: React.FC<Step1LyricsProps> = ({ lyrics, setLyrics, onNext, onDownloadFull }) => {
  const isNextDisabled = lyrics.trim().length < 10;

  const handleDownload = () => {
    if (!lyrics) return;
    const blob = new Blob([`# Lyrics\n\n${lyrics}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lyrics.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div className="text-center flex-1">
          <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Music className="w-8 h-8 text-indigo-400" />
            가사 입력
          </h2>
          <p className="text-slate-400">뮤직비디오를 제작할 노래의 가사를 입력해주세요.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDownloadFull}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-indigo-300 transition-colors border border-slate-700 h-fit"
            title="Download Full Project"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors border border-slate-700 h-fit"
            title="Download Lyrics Only"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 min-h-[400px]">
        <textarea
          className="w-full h-full bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none shadow-inner"
          placeholder="여기에 가사를 붙여넣으세요..."
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
        />
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          disabled={isNextDisabled}
          className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
            isNextDisabled
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-indigo-500/30'
          }`}
        >
          스토리 생성하기 →
        </button>
      </div>
    </div>
  );
};

export default Step1Lyrics;
