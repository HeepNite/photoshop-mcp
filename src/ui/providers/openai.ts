import { createOpenAI } from '@ai-sdk/openai';
import type { ProviderAdapter } from './types.js';

// Curated to models known to support tool calling.
const MODELS = [
  { id: 'gpt-5', label: 'GPT-5' },
  { id: 'gpt-5-mini', label: 'GPT-5 mini' },
  { id: 'gpt-4.1', label: 'GPT-4.1' },
  { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini' },
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
];

export const openaiAdapter: ProviderAdapter = {
  id: 'openai',
  label: 'OpenAI',
  apiKeyHint: 'sk-...',
  apiKeyHelpUrl: 'https://platform.openai.com/api-keys',
  validateApiKeyFormat(key) {
    return key.startsWith('sk-') && key.length > 20;
  },
  async validateApiKey(key) {
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        return { ok: false, error: text };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  },
  listModels() {
    return [...MODELS];
  },
  defaultModel() {
    return 'gpt-4.1-mini';
  },
  getLanguageModel({ apiKey, modelId }) {
    return createOpenAI({ apiKey })(modelId);
  },
};
