
import React, { useState, useEffect } from 'react';
import { saveApiKey, getApiKey, removeApiKey, isVaultActivated, setVaultActivated } from '../utils/keyStorage';

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
      try {
        const selected = await window.aistudio.hasSelectedApiKey();
        setIsProjectKeySelected(selected);
      } catch (e) {
        console.error("Failed to check project key status", e);
      }
    }
  };

  const handleOpenProjectSelector = async () => {
    if (window.aistudio) {
      try {
        // 1. Trigger the native Google AI Studio project selector dialog
        await window.aistudio.openSelectKey();
        
        /**
         * 2. RACE CONDITION MITIGATION:
         * As per strict guidelines, we MUST assume the key selection was successful 
         * after triggering openSelectKey() and proceed to the app immediately.
         */
        setVaultActivated(true);
        setIsProjectKeySelected(true);
        onKeyUpdated();
        setStatus('success');
        
        // Close modal immediately to allow seamless flow
        onClose();
      } catch (e) {
        console.error("Project selection failed or was cancelled", e);
        setStatus('error');
      }
    } else {
      // Fallback: Open AI Studio key page if not in the integrated environment
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
            {/* Primary Action: Official Project Selector */}
            <div className="space-y-4">
              <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-2xl p-4">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block">Recommended: Official Access</label>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  구글 계정에 연결된 프로젝트를 직접 선택하여 Veo 비디오 및 고화질(2K/4K) 기능을 활성화하세요.
                </p>
                <button 
                  onClick={handleOpenProjectSelector}
                  className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold transition-all border ${
                    isProjectKeySelected 
                    ? 'bg-green-500/10 border-green-500/50 text-green-500' 
                    : 'bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-500 hover:scale-[1.02] shadow-lg shadow-indigo-600/20'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
                  {isProjectKeySelected ? 'Project Key Active' : 'Select Google Cloud Project'}
                </button>
              </div>
              
              <div className="flex flex-col gap-2">
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-banana-500 hover:bg-banana-400 text-dark-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-banana-500/10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  Manage Keys in AI Studio
                </a>
                <p className="text-[10px] text-gray-500 text-center leading-relaxed">
                  유료 결제가 설정된 프로젝트를 선택해야 합니다.
                  <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-indigo-400 hover:underline ml-1 font-bold">결제 가이드</a>
                </p>
              </div>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-700"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Manual Override</span>
              <div className="flex-grow border-t border-gray-700"></div>
            </div>

            {/* Manual Entry */}
            <div className="space-y-3">
              <input 
                type="text" 
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="AIza..."
                className="w-full bg-dark-900 border border-gray-700 rounded-xl p-4 text-sm text-white font-mono focus:border-banana-500 outline-none transition-colors"
              />
              <button 
                onClick={handleManualSave}
                disabled={!key}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-20"
              >
                Apply Custom API Key
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700 flex justify-between items-center">
            <button 
              onClick={handleClear}
              className="text-[10px] font-bold text-red-500 hover:opacity-70 transition-opacity uppercase tracking-wider"
            >
              Reset Credentials
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
