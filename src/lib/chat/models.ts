export const DEFAULT_CHAT_MODEL = "gpt-4o-mini";

export const chatModels: { id: string; name: string }[] = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
  },
  {
    id: "grok-4-1-fast-non-reasoning",
    name: "Grok 4.1 Fast Non-Reasoning",
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek-V3.2 (Non-thinking Mode)",
  },
];

export type Provider = "openai" | "gemini" | "anthropic" | "xai" | "deepseek";

const MODEL_TO_PROVIDER_MAP: Record<string, Provider> = {
  "gpt-4o-mini": "openai",
  "gemini-2.5-flash-lite": "gemini",
  "claude-3-5-sonnet": "anthropic",
  "grok-4-1-fast-non-reasoning": "xai",
  "deepseek-chat": "deepseek",
};

export function getProviderForModel(modelId: string): Provider | null {
  return MODEL_TO_PROVIDER_MAP[modelId] ?? null;
}
