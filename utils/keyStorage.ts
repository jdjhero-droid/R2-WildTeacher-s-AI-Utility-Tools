
// Simple local storage utility for API keys (Plain Text as requested)
const STORAGE_KEY = 'wt_api_key_plain';
const ACTIVATION_KEY = 'wt_vault_activated';

export const saveApiKey = (apiKey: string) => {
  localStorage.setItem(STORAGE_KEY, apiKey);
};

export const getApiKey = (): string | null => {
  return localStorage.getItem(STORAGE_KEY);
};

export const removeApiKey = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ACTIVATION_KEY);
};

export const isVaultActivated = (): boolean => {
  // 기본값을 false로 변경하여 초기 접속 시 비활성화 상태가 되도록 수정
  return localStorage.getItem(ACTIVATION_KEY) === 'true';
};

export const setVaultActivated = (active: boolean) => {
  localStorage.setItem(ACTIVATION_KEY, active ? 'true' : 'false');
};

export const hasStoredApiKey = (): boolean => {
  const key = getApiKey();
  return !!key && key.startsWith('AIza');
};
