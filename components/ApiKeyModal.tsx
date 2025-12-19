
import React, { useState, useEffect } from 'react';
import { saveApiKey, getApiKey, removeApiKey, isVaultActivated, setVaultActivated } from '../utils/keyStorage';
import { validateApiKey } from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeyUpdated }) => {
  const [key, setKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [isProjectKeySelected, setIsProjectKeySelected] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedKey = getApiKey();
      setKey(storedKey || '');
      checkProjectKeyStatus();
    }
  }, [isOpen]);

  const checkProjectKeyStatus = async () => {
    if (window.aistudio) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setIsProjectKeySelected(selected);
    }
  };

  const handleOpenProjectSelector = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        // After selection, we assume success as per guidelines to avoid race conditions
        setIsProjectKeySelected(true);
        setVaultActivated(true);
        onKeyUpdated();
        setStatus('success');
        setTimeout(() => onClose(), 1000);
      } catch (e) {
        console.error("Project selection failed", e);
      }
    } else {
      // Fallback for when not in the AI Studio environment
      window.open('https://aistudio.google.com/app/apikey', '_blank');
    }
  };

  const handleManualSave = () => {
    if (!key) return;
    saveApiKey(key);
    setVaultActivated(true);
    onKeyUpdated();
    setStatus('success');
    setTimeout(() => onClose(), 800);
  };

  const handleClear = () => {
    removeApiKey();
    setKey('');
    setIsProjectKeySelected(false);
    onKeyUpdated();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-dark-800 border border-gray-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">⚙️</span> API Settings
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Project Selector (Preferred for Veo/Pro) */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Recommended: Official Access</label>
              <button 
                onClick={handleOpenProjectSelector}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold transition-all border ${
                  isProjectKeySelected 
                  ? 'bg-green-500/10 border-green-500/50 text-green-500' 
                  : 'bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-500 hover:scale-[1.02]'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
                {isProjectKeySelected ? 'Project Key Active' : 'Select Google Cloud Project'}
              </button>
              
              <div className="flex flex-col gap-2">
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-banana-500 hover:bg-banana-400 text-dark-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-banana-500/10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  Get API Key from Google AI Studio
                </a>
                <p className="text-[10px] text-gray-500 text-center leading-relaxed">
                  Veo 비디오 및 고화질 이미지 생성을 위해 유료 결제가 활성화된 GCP 프로젝트 키가 필요합니다. 
                  <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-indigo-400 hover:underline ml-1 font-bold">결제 문서 확인</a>
                </p>
              </div>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-700"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Manual Entry</span>
              <div className="flex-grow border-t border-gray-700"></div>
            </div>

            {/* Manual Entry */}
            <div className="space-y-3">
              <input 
                type="text" 
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Paste your API key here (AIza...)"
                className="w-full bg-dark-900 border border-gray-700 rounded-xl p-4 text-sm text-white font-mono focus:border-banana-500 outline-none transition-colors"
              />
              <button 
                onClick={handleManualSave}
                disabled={!key}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-20"
              >
                Apply Manual Key
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700 flex justify-between items-center">
            <button 
              onClick={handleClear}
              className="text-[10px] font-bold text-red-500 hover:opacity-70 transition-opacity uppercase tracking-wider"
            >
              Reset Connection
            </button>
            {status === 'success' && (
              <span className="text-[10px] font-bold text-green-500 animate-pulse flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Config Saved
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
