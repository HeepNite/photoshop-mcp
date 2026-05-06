import { createAnthropic } from '@ai-sdk/anthropic';
import type { ProviderAdapter } from './types.js';

const MODELS = [
  { id: 'claude-opus-4-5', label: 'Claude Opus 4.5' },
  { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
];

export const anthropicAdapter: ProviderAdapter = {
  id: 'anthropic',
  label: 'Anthropic',
  apiKeyHint: 'sk-ant-...',
  apiKeyHelpUrl: 'https://console.anthropic.com/settings/keys',
  validateApiKeyFormat(key) {
    return key.startsWith('sk-ant-');
  },
  async validateApiKey(key) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/models?limit=1', {
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
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
    return 'claude-sonnet-4-5';
  },
  getLanguageModel({ apiKey, modelId }) {
    return createAnthropic({ apiKey })(modelId);
  },
};
