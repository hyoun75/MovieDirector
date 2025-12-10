
import React, { useState, useEffect, useRef } from 'react';
import { Character, Scene, StoryOption, getLocalized, AspectRatio, ImageModel } from '../types';
import { generateStoryboard, generateSceneImages } from '../services/geminiService';
import { Clapperboard, RefreshCw, Clock, Video, Download, FileText, Image as ImageIcon, Settings, X, Loader2, Upload, Plus } from 'lucide-react';

interface Step4StoryboardProps {
  lang: 'ko' | 'en';
  lyrics: string;
  story: StoryOption;
  characters: Character[];
  scenes: Scene[];
  setScenes: (scenes: Scene[]) => void;
  onNext: () => void;
  onDownloadFull: () => void;
}

const Step4Storyboard: React.FC<Step4StoryboardProps> = ({
  lang,
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
  
  // Image Generation State
  const [generatingSceneIndex, setGeneratingSceneIndex] = useState<number | null>(null);
  const [showGenModal, setShowGenModal] = useState(false);
  
  // Gen Settings
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('16:9');
  const [genCount, setGenCount] = useState<number>(1);
  const [selectedModel, setSelectedModel] = useState<ImageModel>('gemini-3-pro-image-preview');
  const [refImages, setRefImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStoryboard = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await generateStoryboard(lyrics, story, characters);
      setScenes(result);
    } catch (err) {
      setError(lang === 'ko' ? '콘티를 생성하는 중 오류가 발생했습니다.' : 'Error generating storyboard.');
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

  const openGenModal = (index: number) => {
    setGeneratingSceneIndex(index);
    // Reset settings defaults
    setSelectedRatio('16:9');
    setGenCount(1);
    setSelectedModel('gemini-3-pro-image-preview');
    setRefImages([]);
    setShowGenModal(true);
  };

  const handleRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setRefImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeRefImage = (idx: number) => {
    setRefImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleGenerateImages = async () => {
    if (generatingSceneIndex === null) return;
    
    const scene = scenes[generatingSceneIndex];
    setShowGenModal(false); // Close modal, show loading on card
    
    // We can show a loading state specific to that card if we want, 
    // but for simplicity let's rely on a visual indicator or global loading if needed.
    // Better: Add a loading state per scene? Or just block UI.
    // Let's use a local state map or just blocking overlay for now, or just indicate on card.
    // I'll reuse 'loading' but that blocks everything. Let's make a new state if needed.
    // Actually, let's keep it simple: Show loading overlay on the card.
    
    // To do that, I need to know which scene is loading. 
    // I'll repurpose 'generatingSceneIndex' to indicate loading if modal is closed?
    // Let's add a separate state `activeGenIndex`.
    const currentIndex = generatingSceneIndex;
    setGeneratingSceneIndex(currentIndex); // Keep it set to show loading spinner on card
    
    try {
      const newImages = await generateSceneImages(
        scene,
        story,
        selectedRatio,
        genCount,
        selectedModel,
        refImages
      );

      const updatedScenes = [...scenes];
      const existingImages = updatedScenes[currentIndex].generatedImages || [];
      updatedScenes[currentIndex] = {
        ...updatedScenes[currentIndex],
        generatedImages: [...existingImages, ...newImages]
      };
      setScenes(updatedScenes);
    } catch (e) {
      console.error(e);
      alert(lang === 'ko' ? '이미지 생성 실패' : 'Failed to generate images');
    } finally {
      setGeneratingSceneIndex(null);
    }
  };

  const handleDownload = () => {
    let md = `# Storyboard for "${getLocalized(story, 'title', lang)}"\n\n`;
    scenes.forEach(s => {
      const visual = getLocalized(s, 'visualAction', lang);
      const mood = getLocalized(s, 'moodAndLighting', lang);
      const camera = getLocalized(s, 'cameraMovement', lang);

      md += `## Scene ${s.sceneNumber} (${s.estimatedDuration})\n`;
      md += `- **Action:** ${visual}\n`;
      md += `- **Camera:** ${camera}\n`;
      md += `- **Mood:** ${mood}\n`;
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
        <p className="mt-6 text-xl text-slate-300 font-medium">
          {lang === 'ko' ? '장면 하나하나를 구성하고 있습니다...' : 'Composing scenes...'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <span className="text-indigo-400">#4</span> {lang === 'ko' ? '콘티 생성' : 'Storyboard'}
          </h2>
          <p className="text-slate-400 mt-1">
            {lang === 'ko' ? '뮤직비디오의 흐름을 보여주는 장면 리스트입니다.' : 'Scene list showing the flow of the music video.'}
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
            title="Download Storyboard Only"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={fetchStoryboard}
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

      {/* Main List */}
      <div className="flex-1 overflow-y-auto pb-4 pr-2 space-y-6">
        {scenes.map((scene, index) => {
          const visual = getLocalized(scene, 'visualAction', lang);
          const mood = getLocalized(scene, 'moodAndLighting', lang);
          const camera = getLocalized(scene, 'cameraMovement', lang);
          const isGenerating = generatingSceneIndex === index && !showGenModal;
          
          return (
            <div key={index} className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden hover:bg-slate-800/60 transition-colors relative">
              {isGenerating && (
                <div className="absolute inset-0 bg-slate-900/80 z-20 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                    <span className="text-indigo-300 text-sm font-medium">Generating Stills...</span>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col md:flex-row">
                {/* Left: Info */}
                <div className="bg-slate-900/50 p-4 flex flex-col justify-between items-center w-full md:w-32 border-b md:border-b-0 md:border-r border-slate-700">
                  <div className="flex flex-col items-center">
                    <span className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">Scene</span>
                    <span className="text-3xl font-bold text-white">{scene.sceneNumber}</span>
                    <div className="flex items-center gap-1 mt-2 text-indigo-400 text-xs font-mono bg-indigo-500/10 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3" />
                      {scene.estimatedDuration}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => openGenModal(index)}
                    className="mt-4 w-full py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded text-xs flex flex-col items-center gap-1 transition-all"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>{lang === 'ko' ? '스틸 생성' : 'Gen Stills'}</span>
                  </button>
                </div>
                
                {/* Right: Content */}
                <div className="p-5 flex-1 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                       <div className="bg-indigo-500/10 p-2 rounded text-indigo-400 mt-0.5">
                         <Clapperboard className="w-5 h-5" />
                       </div>
                       <div className="flex-1">
                         <h4 className="text-sm font-semibold text-indigo-200 mb-1">Visual Action</h4>
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
                          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Mood & Lighting</h4>
                          <p className="text-slate-300 text-sm">{mood}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Generated Images Gallery */}
                  {scene.generatedImages && scene.generatedImages.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                        <ImageIcon className="w-3 h-3" /> Generated Stills
                      </h4>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        {scene.generatedImages.map((img, i) => (
                          <div key={i} className="flex-shrink-0 relative group rounded-lg overflow-hidden border border-slate-700 h-32">
                            <img 
                              src={`data:${img.mimeType};base64,${img.data}`} 
                              alt={`Still ${i}`} 
                              className="h-full w-auto object-cover"
                            />
                            <a 
                              href={`data:${img.mimeType};base64,${img.data}`}
                              download={`scene_${scene.sceneNumber}_still_${i}.png`}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            >
                              <Download className="w-6 h-6 text-white" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-2 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                    <p className="text-slate-400 text-sm italic">
                      <span className="text-slate-500 font-semibold not-italic mr-2">♪ Lyrics:</span>
                      "{scene.lyricsSegment}"
                    </p>
                  </div>
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
          {lang === 'ko' ? '세부 콘티 생성하기 →' : 'Generate Detailed Script →'}
        </button>
      </div>

      {/* Generation Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl p-6 relative">
            <button 
              onClick={() => setShowGenModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              {lang === 'ko' ? '스틸 컷 생성 설정' : 'Generate Stills Settings'}
            </h3>
            
            <div className="space-y-6">
              {/* Count */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  {lang === 'ko' ? '생성할 이미지 수 (1-20)' : 'Number of Images (1-20)'}
                </label>
                <div className="flex items-center gap-4 bg-slate-800 p-3 rounded-lg border border-slate-700">
                  <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    step="1"
                    value={genCount} 
                    onChange={(e) => setGenCount(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="bg-slate-900 px-3 py-1 rounded text-white font-mono font-bold border border-slate-600 w-12 text-center">
                    {genCount}
                  </div>
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Aspect Ratio</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['21:9', '16:9', '1:1', '9:16'] as AspectRatio[]).map(r => (
                    <button
                      key={r}
                      onClick={() => setSelectedRatio(r)}
                      className={`py-2 rounded-lg text-xs font-medium border ${
                        selectedRatio === r 
                        ? 'bg-indigo-600 border-indigo-500 text-white' 
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Model</label>
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as ImageModel)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option value="gemini-3-pro-image-preview">Nano Banana Pro (High Quality)</option>
                  <option value="gemini-2.5-flash-image">Nano Banana (Fast)</option>
                </select>
              </div>

              {/* Reference Images */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Reference Images (Optional)</label>
                <div className="flex flex-wrap gap-2">
                   {refImages.map((src, i) => (
                     <div key={i} className="relative w-16 h-16 rounded overflow-hidden border border-slate-600">
                       <img src={src} alt="ref" className="w-full h-full object-cover" />
                       <button onClick={() => removeRefImage(i)} className="absolute top-0 right-0 bg-red-500/80 p-0.5 text-white">
                         <X className="w-3 h-3" />
                       </button>
                     </div>
                   ))}
                   <input 
                      type="file" 
                      multiple 
                      accept="image/*"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleRefImageUpload}
                   />
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="w-16 h-16 rounded border-2 border-dashed border-slate-600 flex items-center justify-center hover:border-indigo-500 hover:bg-slate-800 transition-colors"
                   >
                     <Plus className="w-5 h-5 text-slate-400" />
                   </button>
                </div>
              </div>
              
              <button
                onClick={handleGenerateImages}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
              >
                <ImageIcon className="w-5 h-5" />
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step4Storyboard;
