
import React, { useState } from 'react';
import { GeneratedScene, TitleData } from '../types';

interface ResultGridProps {
  scenes: GeneratedScene[];
  titles?: TitleData[];
  musicPrompt?: string | null;
  lyrics?: string | null;
  isGeneratingStory: boolean;
  onRegenerate: (index: number, newPrompt: string) => void;
  onSetAsReference: (imageUrl: string) => void;
  // Veo Props
  videoUrl: string | null;
  isGeneratingVideo: boolean;
  veoError?: string | null;
  onRetryVeo?: () => void;
  // Title Regeneration Props
  onRegenerateTitles?: () => void;
  isRegeneratingTitles?: boolean;
  // Prompt Selection
  onSelectPrompt?: (prompt: string) => void;
}

export const ResultGrid: React.FC<ResultGridProps> = ({ 
  scenes, 
  titles = [], 
  musicPrompt,
  lyrics,
  isGeneratingStory, 
  onRegenerate,
  onSetAsReference,
  videoUrl,
  isGeneratingVideo,
  veoError,
  onRetryVeo,
  onRegenerateTitles,
  isRegeneratingTitles,
  onSelectPrompt
}) => {
  const [editingScene, setEditingScene] = useState<{ index: number; prompt: string } | null>(null);

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    scenes.filter(s => s.imageUrl).forEach((s, i) => {
      setTimeout(() => downloadImage(s.imageUrl!, `Scene_${s.sceneNumber}.png`), i * 500);
    });
  };

  const showVideoSection = videoUrl || isGeneratingVideo || veoError;
  const showStorySection = scenes.length > 0 || isGeneratingStory;

  if (!showStorySection && !showVideoSection) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-600 p-10">
        <div className="w-20 h-20 mb-6 opacity-20">
            <svg fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" /></svg>
        </div>
        <h2 className="text-xl font-bold mb-2 text-white">No Content Generated Yet</h2>
        <p className="text-center max-w-sm">Upload an image and type a topic in the sidebar to start your creative storyboard journey.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto relative scrollbar-hide bg-dark-900">
      <div className="max-w-7xl mx-auto pb-20 space-y-16">
        
        {/* VEO CINEMATIC VIDEO */}
        {showVideoSection && (
            <div className={`bg-dark-800 rounded-3xl border overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 ${veoError ? 'border-red-900/50' : 'border-indigo-900/30'}`}>
                <div className={`p-5 border-b flex items-center justify-between ${veoError ? 'bg-red-900/10' : 'bg-indigo-900/10'}`}>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">🎬 Veo Cinematic Production</h2>
                </div>
                <div className="aspect-video bg-black relative flex items-center justify-center">
                    {isGeneratingVideo ? (
                        <div className="text-center space-y-4">
                             <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                             <p className="text-indigo-400 font-bold animate-pulse text-lg">Rendering AI Cinema...</p>
                        </div>
                    ) : veoError ? (
                        <div className="text-center p-12">
                            <p className="text-red-400 font-bold mb-6 text-lg">{veoError}</p>
                            {onRetryVeo && (
                                <button onClick={onRetryVeo} className="px-8 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-bold shadow-lg shadow-red-600/20 transition-all active:scale-95">
                                    Retry with Paid API Key
                                </button>
                            )}
                        </div>
                    ) : videoUrl ? (
                        <video src={videoUrl} controls autoPlay loop muted className="w-full h-full object-contain" />
                    ) : null}
                </div>
            </div>
        )}

        {/* STORYBOARD CUTS */}
        {showStorySection && (
            <div className="space-y-8">
                 <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-3">
                        <h2 className="text-3xl font-bold text-white tracking-tight">Storyboard Cuts</h2>
                        <span className="text-banana-500 font-mono text-sm font-bold bg-banana-500/10 px-2 py-0.5 rounded border border-banana-500/20">{scenes.length}</span>
                    </div>
                    {scenes.some(s => s.imageUrl) && (
                        <button 
                            onClick={handleDownloadAll} 
                            className="px-5 py-2.5 bg-dark-800 hover:bg-dark-700 border border-gray-700 rounded-xl text-sm text-gray-300 font-bold flex items-center gap-2 transition-all hover:border-banana-500 hover:text-white"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Batch Export
                        </button>
                    )}
                </div>

                {isGeneratingStory ? (
                     <div className="py-24 flex flex-col items-center justify-center bg-dark-800 rounded-3xl border border-dashed border-gray-700 animate-pulse">
                        <div className="w-12 h-12 border-4 border-banana-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p className="text-banana-500 text-lg font-bold">Drafting Visual Narrative...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {scenes.map((scene, index) => (
                            <div key={index} className="bg-dark-800 rounded-3xl overflow-hidden border border-gray-800 flex flex-col group transition-all hover:border-gray-600 hover:shadow-2xl shadow-black">
                                <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                                    {scene.imageUrl ? (
                                        <>
                                            <img src={scene.imageUrl} alt="Scene" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                            
                                            {/* HIGH-END OVERLAY ACTIONS */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-6">
                                                <button 
                                                    onClick={() => downloadImage(scene.imageUrl!, `Scene_${scene.sceneNumber}.png`)}
                                                    className="p-4 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-banana-500 hover:text-dark-900 transition-all transform translate-y-4 group-hover:translate-y-0 shadow-xl border border-white/20"
                                                    title="Download Cut"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                </button>
                                                <button 
                                                    onClick={() => setEditingScene({ index, prompt: scene.imagePrompt })}
                                                    className="p-4 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-banana-500 hover:text-dark-900 transition-all transform translate-y-4 group-hover:translate-y-0 shadow-xl border border-white/20 delay-[50ms]"
                                                    title="Regenerate This Scene"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                </button>
                                                <button 
                                                    onClick={() => onSetAsReference(scene.imageUrl!)}
                                                    className="p-4 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-banana-500 hover:text-dark-900 transition-all transform translate-y-4 group-hover:translate-y-0 shadow-xl border border-white/20 delay-[100ms]"
                                                    title="Set as New Reference"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </>
                                    ) : scene.isLoading ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 border-2 border-banana-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                            <span className="text-xs text-banana-500 font-mono tracking-widest uppercase">Rendering...</span>
                                        </div>
                                    ) : scene.error ? (
                                        <p className="text-red-500 text-xs text-center px-6 font-medium">{scene.error}</p>
                                    ) : null}
                                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/80 text-xs font-black rounded-lg backdrop-blur-md pointer-events-none text-banana-400 border border-white/10 z-10">
                                        CUT {scene.sceneNumber}
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col gap-4 flex-1">
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2">Narrative Arc</p>
                                        <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed font-medium">{scene.description}</p>
                                    </div>
                                    <div className="mt-auto pt-4 border-t border-gray-700/50">
                                        <p className="text-[10px] text-banana-500 font-black uppercase tracking-[0.2em] mb-2">I2V Directives</p>
                                        <div 
                                            onClick={() => onSelectPrompt?.(scene.i2vPrompt)} 
                                            className="text-[10px] text-green-400/90 font-mono block bg-black/60 p-3 rounded-xl cursor-pointer hover:bg-black/90 transition-all border border-white/5 hover:border-banana-500/50 group/motion"
                                        >
                                            <span className="opacity-70 group-hover/motion:opacity-100">{scene.i2vPrompt}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* TITLES SECTION */}
                {titles.length > 0 && (
                    <div className="mt-20 border-t border-gray-800 pt-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                                🔥 Viral YouTube Titles
                            </h2>
                            {onRegenerateTitles && (
                                <button 
                                    onClick={onRegenerateTitles} 
                                    disabled={isRegeneratingTitles}
                                    className="text-xs text-gray-500 hover:text-white transition-colors underline underline-offset-4"
                                >
                                    {isRegeneratingTitles ? 'Generating New Hooks...' : 'Regenerate All Titles'}
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {titles.map((t, i) => (
                                <div 
                                    key={i} 
                                    className="p-5 bg-gray-800/20 border border-gray-800 rounded-2xl group hover:border-banana-500 hover:bg-gray-800/40 transition-all cursor-pointer shadow-lg active:scale-[0.98]" 
                                    onClick={() => {
                                        navigator.clipboard.writeText(t.english + '\n' + t.korean);
                                        // Optional: Add a toast notification here
                                    }}
                                >
                                    <div className="flex items-start gap-4">
                                        <span className="text-gray-600 font-black text-xs pt-1">{String(i + 1).padStart(2, '0')}</span>
                                        <div className="flex-1">
                                            <p className="text-white font-bold text-lg group-hover:text-banana-400 transition-colors leading-tight">{t.english}</p>
                                            <p className="text-gray-500 text-sm mt-2 font-medium">{t.korean}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* MUSIC PRODUCER SECTION (Now at the Bottom) */}
                {musicPrompt && (
                    <div className="mt-20 bg-indigo-950/20 border border-indigo-500/30 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="p-6 bg-indigo-900/30 border-b border-indigo-500/20 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <span className="bg-indigo-500 p-2 rounded-xl text-dark-900">🎵</span>
                                Producer's Billboard Strategy
                            </h2>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                                    <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">Production Directive</h3>
                                </div>
                                <div className="relative group">
                                    <pre className="bg-black/50 p-6 rounded-[1.5rem] text-sm text-gray-300 whitespace-pre-wrap font-mono border border-white/5 leading-relaxed group-hover:border-indigo-500/30 transition-colors">
                                        {musicPrompt}
                                    </pre>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                                    <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">Top-Liner Lyrics</h3>
                                </div>
                                <div className="relative group">
                                    <pre className="bg-black/50 p-6 rounded-[1.5rem] text-sm text-gray-300 whitespace-pre-wrap font-mono border border-white/5 max-h-[400px] overflow-y-auto scrollbar-hide leading-loose group-hover:border-indigo-500/30 transition-colors">
                                        {lyrics}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      {editingScene && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6 animate-in fade-in duration-300">
              <div className="bg-dark-800 p-8 rounded-[2rem] border border-gray-700 w-full max-w-2xl shadow-3xl">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="bg-banana-500 p-2 rounded-lg text-dark-900 font-black text-xs">AI</div>
                      <h3 className="text-2xl font-bold text-white">Adjust Visual Prompt</h3>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 font-medium leading-relaxed">
                      Modify the visual directives for Cut {editingScene.index + 1}. The AI will use this prompt to regenerate the frame while maintaining storyboard consistency.
                  </p>
                  <textarea 
                    autoFocus
                    value={editingScene.prompt} 
                    onChange={(e) => setEditingScene({...editingScene, prompt: e.target.value})} 
                    className="w-full h-48 bg-black/40 border border-gray-700 rounded-2xl p-5 text-sm text-white font-mono mb-8 resize-none focus:outline-none focus:border-banana-500 transition-all placeholder-gray-600"
                    placeholder="Describe specific visual changes..."
                  />
                  <div className="flex justify-end gap-4">
                      <button 
                        onClick={() => setEditingScene(null)} 
                        className="px-6 py-3 text-gray-400 hover:text-white font-bold transition-colors"
                      >
                        Discard
                      </button>
                      <button 
                        onClick={() => { onRegenerate(editingScene.index, editingScene.prompt); setEditingScene(null); }} 
                        className="px-10 py-3 bg-banana-500 text-dark-900 font-black rounded-xl hover:bg-banana-400 transition-all shadow-xl shadow-banana-500/10 active:scale-95"
                      >
                        Regenerate Frame
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
