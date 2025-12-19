
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ResultGrid } from './components/ResultGrid';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ModelType, GeneratedScene, AspectRatio, TitleData, VeoModel, VeoAspectRatio, VeoResolution, ImageResolution } from './types';
import { generateStoryStructure, generateSceneImage, generateVeoVideo, generateTitles } from './services/geminiService';
import { hasStoredApiKey, isVaultActivated, setVaultActivated, removeApiKey } from './utils/keyStorage';

const App: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.NanoBanana);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>('16:9');
  const [selectedResolution, setSelectedResolution] = useState<ImageResolution>('1K');
  const [sceneCount, setSceneCount] = useState<number>(10);
  const [scenes, setScenes] = useState<GeneratedScene[]>([]);
  const [titles, setTitles] = useState<TitleData[]>([]);
  const [musicPrompt, setMusicPrompt] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isRegeneratingTitles, setIsRegeneratingTitles] = useState(false);

  const [veoModel, setVeoModel] = useState<VeoModel>('veo-3.1-fast-generate-preview');
  const [veoAspectRatio, setVeoAspectRatio] = useState<VeoAspectRatio>('16:9');
  const [veoResolution, setVeoResolution] = useState<VeoResolution>('720p');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [veoError, setVeoError] = useState<string | null>(null);

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isKeyActive, setIsKeyActive] = useState(false);

  useEffect(() => {
    checkKeyStatus();
  }, []);

  const checkKeyStatus = async () => {
    // 활성화 여부를 먼저 확인
    const activated = isVaultActivated();
    if (!activated) {
      setIsKeyActive(false);
      return;
    }

    const hasManual = hasStoredApiKey();
    let hasProject = false;
    if (window.aistudio) {
      hasProject = await window.aistudio.hasSelectedApiKey();
    }
    setIsKeyActive(hasManual || hasProject || !!process.env.API_KEY);
  };

  const ensureKey = (): boolean => {
    if (isKeyActive) return true;
    setIsApiKeyModalOpen(true);
    return false;
  };

  const handleGenerateStoryboard = async () => {
    if (!ensureKey()) return;
    if (!topic) return;

    setIsGenerating(true);
    setIsGeneratingStory(true);
    setScenes([]);
    setTitles([]);
    setMusicPrompt(null);
    setLyrics(null);

    try {
      const result = await generateStoryStructure(topic, referenceImage, sceneCount);
      const initializedScenes: GeneratedScene[] = result.scenes.map(s => ({ ...s, isLoading: true }));
      setScenes(initializedScenes);
      setTitles(result.titles);
      setMusicPrompt(result.musicPrompt);
      setLyrics(result.lyrics);
      setIsGeneratingStory(false);

      initializedScenes.forEach(async (scene, index) => {
        try {
          const imageUrl = await generateSceneImage(selectedModel, scene.imagePrompt, selectedAspectRatio, selectedResolution, referenceImage);
          setScenes(prev => {
            const newScenes = [...prev];
            if (newScenes[index]) newScenes[index] = { ...newScenes[index], imageUrl, isLoading: false };
            return newScenes;
          });
        } catch (error) {
          setScenes(prev => {
            const newScenes = [...prev];
            if (newScenes[index]) newScenes[index] = { ...newScenes[index], isLoading: false, error: 'Render Error' };
            return newScenes;
          });
        }
      });
    } catch (error: any) {
      console.error(error);
      setIsApiKeyModalOpen(true);
    } finally {
      setIsGenerating(false);
      setIsGeneratingStory(false);
    }
  };

  const handleGenerateVeoVideo = async () => {
    if (!ensureKey()) return;
    if (!topic) return;

    setIsGeneratingVideo(true);
    setGeneratedVideoUrl(null);
    setVeoError(null);

    try {
        const videoUrl = await generateVeoVideo(veoModel, topic, veoAspectRatio, veoResolution, referenceImage);
        setGeneratedVideoUrl(videoUrl);
    } catch (error: any) {
        setVeoError(error.message || "Video failed.");
        // Specific requirement: reset key state if "Requested entity was not found" occurs
        if (error.message?.includes("Requested entity was not found")) {
            setVaultActivated(false);
            setIsKeyActive(false);
            setIsApiKeyModalOpen(true);
        } else {
            setIsApiKeyModalOpen(true);
        }
    } finally {
        setIsGeneratingVideo(false);
    }
  };

  const handleRegenerateScene = async (index: number, newPrompt: string) => {
     if (!ensureKey()) return;
     setScenes(prev => {
         const newScenes = [...prev];
         if (newScenes[index]) {
             newScenes[index] = { ...newScenes[index], imagePrompt: newPrompt, isLoading: true, error: undefined, imageUrl: undefined };
         }
         return newScenes;
     });
     try {
         const imageUrl = await generateSceneImage(selectedModel, newPrompt, selectedAspectRatio, selectedResolution, referenceImage);
         setScenes(prev => {
            const newScenes = [...prev];
            if (newScenes[index]) newScenes[index] = { ...newScenes[index], imageUrl, isLoading: false };
            return newScenes;
         });
     } catch (error) {
         setScenes(prev => {
            const newScenes = [...prev];
            if (newScenes[index]) newScenes[index] = { ...newScenes[index], isLoading: false, error: 'Retry Failed' };
            return newScenes;
         });
     }
  };

  return (
    <div className="flex h-screen w-screen bg-dark-900 text-white overflow-hidden font-sans">
      <Sidebar 
        selectedModel={selectedModel}
        onModelSelect={setSelectedModel}
        selectedAspectRatio={selectedAspectRatio}
        onAspectRatioSelect={setSelectedAspectRatio}
        selectedResolution={selectedResolution}
        onResolutionSelect={setSelectedResolution}
        sceneCount={sceneCount}
        onSceneCountChange={setSceneCount}
        topic={topic}
        onTopicChange={setTopic}
        referenceImage={referenceImage}
        onImageUpload={setReferenceImage}
        onGenerate={handleGenerateStoryboard}
        isGenerating={isGenerating}
        veoModel={veoModel}
        onVeoModelSelect={setVeoModel}
        veoAspectRatio={veoAspectRatio}
        onVeoAspectRatioSelect={setVeoAspectRatio}
        veoResolution={veoResolution}
        onVeoResolutionSelect={setVeoResolution}
        onVeoGenerate={handleGenerateVeoVideo}
        isGeneratingVideo={isGeneratingVideo}
        onOpenApiSettings={() => setIsApiKeyModalOpen(true)}
        apiKeySet={isKeyActive} 
      />
      <ResultGrid 
        scenes={scenes}
        titles={titles}
        musicPrompt={musicPrompt}
        lyrics={lyrics}
        isGeneratingStory={isGeneratingStory}
        onRegenerate={handleRegenerateScene}
        onSetAsReference={setReferenceImage}
        videoUrl={generatedVideoUrl}
        isGeneratingVideo={isGeneratingVideo}
        veoError={veoError}
        onRetryVeo={handleGenerateVeoVideo}
        onRegenerateTitles={async () => {
            setIsRegeneratingTitles(true);
            try { setTitles(await generateTitles(topic)); } catch (e) {} finally { setIsRegeneratingTitles(false); }
        }}
        isRegeneratingTitles={isRegeneratingTitles}
        onSelectPrompt={setTopic}
      />
      <ApiKeyModal 
        isOpen={isApiKeyModalOpen} 
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeyUpdated={checkKeyStatus}
      />
    </div>
  );
};

export default App;
