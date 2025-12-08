
import React, { useState, useEffect } from 'react';
import { Character, StoryOption } from '../types';
import { generateCharacters } from '../services/geminiService';
import { Users, RefreshCw, UserCircle, Download, FileText } from 'lucide-react';

interface Step3CharactersProps {
  lyrics: string;
  story: StoryOption;
  characters: Character[];
  setCharacters: (chars: Character[]) => void;
  onNext: () => void;
  onDownloadFull: () => void;
}

const Step3Characters: React.FC<Step3CharactersProps> = ({
  lyrics,
  story,
  characters,
  setCharacters,
  onNext,
  onDownloadFull
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCharacters = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await generateCharacters(story, lyrics);
      setCharacters(result);
    } catch (err) {
      setError('캐릭터를 생성하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (characters.length === 0) {
      fetchCharacters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = () => {
    let md = `# Characters for "${story.title}"\n\n`;
    characters.forEach(c => {
      md += `## ${c.name} (${c.role})\n`;
      md += `- **Visual:** ${c.visualDescription}\n`;
      md += `- **Personality:** ${c.personality}\n`;
      md += `- **Outfit:** ${c.outfit}\n\n`;
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'characters.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px]">
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-6 text-xl text-slate-300 font-medium">스토리에 어울리는 등장인물을 캐스팅 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <span className="text-indigo-400">#3</span> 등장인물 생성
          </h2>
          <p className="text-slate-400 mt-1">"{story.title}"에 등장할 캐릭터들입니다.</p>
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
            title="Download Characters Only"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={fetchCharacters}
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

      <div className="grid grid-cols-1 gap-6 flex-1 overflow-y-auto pb-4 pr-2">
        {characters.map((char, index) => (
          <div key={index} className="flex flex-col md:flex-row gap-6 bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <div className="flex-shrink-0 flex flex-col items-center justify-center md:w-48 bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
              <UserCircle className="w-20 h-20 text-indigo-400 mb-2" />
              <h3 className="text-lg font-bold text-white text-center">{char.name}</h3>
              <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded mt-1">{char.role}</span>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Visual</h4>
                <p className="text-slate-200">{char.visualDescription}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Personality</h4>
                  <p className="text-slate-300 text-sm">{char.personality}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Outfit</h4>
                  <p className="text-slate-300 text-sm">{char.outfit}</p>
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
          콘티 생성하기 →
        </button>
      </div>
    </div>
  );
};

export default Step3Characters;
