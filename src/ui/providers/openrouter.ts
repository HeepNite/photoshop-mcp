import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { ProviderAdapter } from './types.js';

// Curated to models known to support tool calling on OpenRouter.
const MODELS = [
  { id: 'anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5' },
  { id: 'anthropic/claude-opus-4.5', label: 'Claude Opus 4.5' },
  { id: 'openai/gpt-5', label: 'GPT-5' },
  { id: 'openai/gpt-4.1-mini', label: 'GPT-4.1 mini' },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
];

export const openrouterAdapter: ProviderAdapter = {
  id: 'openrouter',
  label: 'OpenRouter',
  apiKeyHint: 'sk-or-v1-...',
  apiKeyHelpUrl: 'https://openrouter.ai/keys',
  validateApiKeyFormat(key) {
    return key.startsWith('sk-or-');
  },
  async validateApiKey(key) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
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
    return 'anthropic/claude-sonnet-4.5';
  },
  getLanguageModel({ apiKey, modelId }) {
    return createOpenRouter({ apiKey })(modelId);
  },
};
