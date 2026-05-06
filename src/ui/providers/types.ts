import type { LanguageModel } from 'ai';

export type ProviderId = 'anthropic' | 'openai' | 'openrouter';

export interface ProviderModel {
  id: string;
  label: string;
}

export interface ApiKeyValidation {
  ok: boolean;
  error?: string;
}

export interface ProviderAdapter {
  id: ProviderId;
  label: string;
  apiKeyHint: string;
  apiKeyHelpUrl: string;
  validateApiKeyFormat(key: string): boolean;
  validateApiKey(key: string): Promise<ApiKeyValidation>;
  listModels(): ProviderModel[];
  defaultModel(): string;
  getLanguageModel(opts: { apiKey: string; modelId: string }): LanguageModel;
}
