
import React, { useState, useEffect, useRef } from 'react';
import { Character, StoryOption, getLocalized } from '../types';
import { generateCharacters, regenerateCharacter } from '../services/geminiService';
import { Users, RefreshCw, UserCircle, Download, FileText, Plus, Trash2, Pencil, Save, X, Image as ImageIcon, Sparkles, Tag } from 'lucide-react';

interface Step3CharactersProps {
  lang: 'ko' | 'en';
  lyrics: string;
  story: StoryOption;
  characters: Character[];
  setCharacters: (chars: Character[]) => void;
  onNext: () => void;
  onDownloadFull: () => void;
}

const Step3Characters: React.FC<Step3CharactersProps> = ({
  lang,
  lyrics,
  story,
  characters,
  setCharacters,
  onNext,
  onDownloadFull
}) => {
  const [loading, setLoading] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  
  // Editing State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Character | null>(null);
  const [userInstruction, setUserInstruction] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentKeywordInput, setCurrentKeywordInput] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCharacters = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await generateCharacters(story, lyrics);
      setCharacters(result);
    } catch (err) {
      setError(lang === 'ko' ? '캐릭터를 생성하는 중 오류가 발생했습니다.' : 'Error generating characters.');
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

  // Handlers for List Management
  const handleAddCharacter = () => {
    const newChar: Character = {
      name: 'New Character',
      role: 'Role',
      visualDescription: 'Description...',
      personality: 'Personality...',
      outfit: 'Outfit...',
      keywords: ['New']
    };
    const newIndex = characters.length;
    setCharacters([...characters, newChar]);
    setEditingIndex(newIndex);
    setEditForm(newChar);
    setUserInstruction('');
    setSelectedImage(null);
  };

  const handleDeleteCharacter = (index: number) => {
    const newChars = characters.filter((_, i) => i !== index);
    setCharacters(newChars);
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditForm(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  // Handlers for Editing
  const startEditing = (index: number) => {
    setEditingIndex(index);
    // Initialize form with current values
    setEditForm({ ...characters[index] });
    setUserInstruction('');
    setSelectedImage(null);
    setCurrentKeywordInput('');
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditForm(null);
    setUserInstruction('');
    setSelectedImage(null);
  };

  const saveManualChanges = () => {
    if (editForm && editingIndex !== null) {
      const updatedChars = [...characters];
      // For manual edits, update both localized fields to same value if simplified, 
      // or just update primary fields and let fallback handle it.
      // Here we assume manual edit updates the 'default' fields. 
      // If we wanted robust bilingual editing, we'd need dual inputs.
      updatedChars[editingIndex] = editForm;
      setCharacters(updatedChars);
      setEditingIndex(null);
    }
  };

  const addKeyword = () => {
    if (!editForm || !currentKeywordInput.trim()) return;
    const newKeyword = currentKeywordInput.trim();
    const currentKeywords = editForm.keywords || [];
    if (!currentKeywords.includes(newKeyword)) {
      setEditForm({
        ...editForm,
        keywords: [...currentKeywords, newKeyword]
      });
    }
    setCurrentKeywordInput('');
  };

  const removeKeyword = (keywordToRemove: string) => {
    if (!editForm || !editForm.keywords) return;
    setEditForm({
      ...editForm,
      keywords: editForm.keywords.filter(k => k !== keywordToRemove)
    });
  };

  // Handler for AI Regeneration
  const handleAIRegenerate = async () => {
    if (editingIndex === null || !editForm) return;

    setRegeneratingId(editingIndex);
    setError('');
    
    try {
      const updatedChar = await regenerateCharacter(
        editForm,
        story,
        userInstruction || "Improve based on keywords and description.",
        selectedImage ? selectedImage.split(',')[1] : undefined 
      );
      
      setEditForm(updatedChar);
      
      const updatedChars = [...characters];
      updatedChars[editingIndex] = updatedChar;
      setCharacters(updatedChars);
      
      setUserInstruction('');
      setSelectedImage(null);
    } catch (err) {
      setError(lang === 'ko' ? '캐릭터 재생성 중 오류가 발생했습니다.' : 'Error regenerating character.');
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    let md = `# Characters for "${getLocalized(story, 'title', lang)}"\n\n`;
    characters.forEach(c => {
      const name = getLocalized(c, 'name', lang);
      const role = getLocalized(c, 'role', lang);
      const visual = getLocalized(c, 'visualDescription', lang);
      const personality = getLocalized(c, 'personality', lang);
      const outfit = getLocalized(c, 'outfit', lang);

      md += `## ${name} (${role})\n`;
      if (c.keywords && c.keywords.length > 0) {
        md += `**Keywords:** ${c.keywords.join(', ')}\n\n`;
      }
      md += `- **Visual:** ${visual}\n`;
      md += `- **Personality:** ${personality}\n`;
      md += `- **Outfit:** ${outfit}\n\n`;
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
        <p className="mt-6 text-xl text-slate-300 font-medium">
          {lang === 'ko' ? '스토리에 어울리는 등장인물을 캐스팅 중입니다...' : 'Casting characters for the story...'}
        </p>
      </div>
    );
  }

  const storyTitle = getLocalized(story, 'title', lang);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <span className="text-indigo-400">#3</span> {lang === 'ko' ? '등장인물 생성' : 'Characters'}
          </h2>
          <p className="text-slate-400 mt-1">
            {lang === 'ko' ? `"${storyTitle}"에 등장할 캐릭터들입니다.` : `Characters for "${storyTitle}".`}
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
            title="Download Characters Only"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={fetchCharacters}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {lang === 'ko' ? '전체 재생성' : 'Regenerate All'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 flex-1 overflow-y-auto pb-4 pr-2">
        {characters.map((char, index) => {
          const isEditing = editingIndex === index;
          const isRegenerating = regeneratingId === index;
          
          const name = getLocalized(char, 'name', lang);
          const role = getLocalized(char, 'role', lang);
          const visual = getLocalized(char, 'visualDescription', lang);
          const personality = getLocalized(char, 'personality', lang);
          const outfit = getLocalized(char, 'outfit', lang);

          if (isEditing && editForm) {
            // In edit mode, we show fields. Since we didn't implement fully bilingual inputs, 
            // we will show the current language's value in the input, but saving will overwrite the 'default' fields.
            // A production app would have tabs for EN/KO inputs.
            return (
              <div key={index} className="bg-indigo-900/10 border-2 border-indigo-500/50 rounded-xl p-6 animate-fade-in relative">
                <div className="flex justify-between items-center mb-4 border-b border-indigo-500/30 pb-3">
                  <h3 className="text-lg font-bold text-indigo-300 flex items-center gap-2">
                    <Pencil className="w-4 h-4" /> Edit Character
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={saveManualChanges} className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors" title="Save">
                      <Save className="w-5 h-5" />
                    </button>
                    <button onClick={cancelEditing} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors" title="Cancel">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: AI Controls */}
                  <div className="md:col-span-1 space-y-4 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <h4 className="text-sm font-semibold text-indigo-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> AI Regeneration
                    </h4>
                    
                    <div>
                      <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <Tag className="w-3 h-3" /> Keywords
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input 
                          type="text" 
                          value={currentKeywordInput}
                          onChange={(e) => setCurrentKeywordInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                          placeholder="Add keyword..."
                          className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                        />
                        <button onClick={addKeyword} className="bg-slate-700 px-2 rounded hover:bg-indigo-600 transition-colors">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {editForm.keywords?.map((k, i) => (
                           <span key={i} className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded-full border border-indigo-500/30">
                             {k}
                             <button onClick={() => removeKeyword(k)} className="hover:text-red-400"><X className="w-3 h-3"/></button>
                           </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Instruction</label>
                      <textarea
                        value={userInstruction}
                        onChange={(e) => setUserInstruction(e.target.value)}
                        placeholder="e.g. Make him look like a cyberpunk warrior..."
                        className="w-full h-20 bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Reference Image (Optional)</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full py-2 border border-dashed rounded flex items-center justify-center gap-2 text-xs transition-colors ${
                          selectedImage ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-slate-600 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                         <ImageIcon className="w-3 h-3" />
                         {selectedImage ? 'Image Loaded' : 'Upload Image'}
                      </button>
                      {selectedImage && (
                        <div className="mt-2 relative w-full h-24 rounded overflow-hidden">
                          <img src={selectedImage} alt="Reference" className="w-full h-full object-cover opacity-70" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                            className="absolute top-1 right-1 bg-black/50 hover:bg-red-500/80 rounded-full p-1 text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleAIRegenerate}
                      disabled={isRegenerating}
                      className={`w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${
                        isRegenerating
                        ? 'bg-slate-700 text-slate-400 cursor-wait'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      }`}
                    >
                      {isRegenerating ? (
                         <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                         <Sparkles className="w-4 h-4" />
                      )}
                      {isRegenerating ? 'Processing...' : 'Auto-Update'}
                    </button>
                  </div>

                  {/* Right Column: Editable Fields */}
                  <div className="md:col-span-2 space-y-4">
                     {/* Note: Simplified editing for now (edits 'default' fields, not language specific ones) */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Role</label>
                        <input
                          type="text"
                          value={editForm.role}
                          onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                          className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Visual Description</label>
                      <textarea
                        value={editForm.visualDescription}
                        onChange={(e) => setEditForm({...editForm, visualDescription: e.target.value})}
                        className="w-full h-20 bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Personality</label>
                        <input
                          type="text"
                          value={editForm.personality}
                          onChange={(e) => setEditForm({...editForm, personality: e.target.value})}
                          className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Outfit</label>
                        <input
                          type="text"
                          value={editForm.outfit}
                          onChange={(e) => setEditForm({...editForm, outfit: e.target.value})}
                          className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={index} className="flex flex-col md:flex-row gap-6 bg-slate-800/50 p-6 rounded-xl border border-slate-700 relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button
                   onClick={() => startEditing(index)}
                   className="p-2 bg-slate-700 hover:bg-indigo-600 text-white rounded-lg transition-colors shadow-lg"
                   title="Edit / AI Regenerate"
                 >
                   <Pencil className="w-4 h-4" />
                 </button>
                 <button
                   onClick={() => handleDeleteCharacter(index)}
                   className="p-2 bg-slate-700 hover:bg-red-600 text-white rounded-lg transition-colors shadow-lg"
                   title="Delete Character"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>

              <div className="flex-shrink-0 flex flex-col items-center justify-center md:w-48 bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <UserCircle className="w-20 h-20 text-indigo-400 mb-2" />
                <h3 className="text-lg font-bold text-white text-center">{name}</h3>
                <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded mt-1">{role}</span>
                {char.keywords && char.keywords.length > 0 && (
                   <div className="flex flex-wrap justify-center gap-1 mt-3">
                     {char.keywords.slice(0, 3).map((k, i) => (
                       <span key={i} className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-sm">{k}</span>
                     ))}
                   </div>
                )}
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Visual</h4>
                  <p className="text-slate-200">{visual}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Personality</h4>
                    <p className="text-slate-300 text-sm">{personality}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Outfit</h4>
                    <p className="text-slate-300 text-sm">{outfit}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        <button
          onClick={handleAddCharacter}
          className="w-full py-4 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition-all hover:bg-slate-800/30"
        >
          <Plus className="w-6 h-6 mr-2" /> {lang === 'ko' ? '인물 추가하기' : 'Add Character'}
        </button>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          className="px-8 py-3 rounded-lg font-semibold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-indigo-500/30 hover:scale-105 transition-all"
        >
          {lang === 'ko' ? '콘티 생성하기 →' : 'Generate Storyboard →'}
        </button>
      </div>
    </div>
  );
};

export default Step3Characters;
