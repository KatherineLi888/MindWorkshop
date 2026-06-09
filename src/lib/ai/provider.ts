import OpenAI from "openai";

export type AiProvider = "openai" | "deepseek";

export type AiSettings = {
  apiKey?: string;
  provider?: AiProvider;
};

export const AI_PROVIDER_META: Record<
  AiProvider,
  { label: string; model: string; baseURL?: string; keyHint: string }
> = {
  openai: {
    label: "OpenAI",
    model: "gpt-4o-mini",
    keyHint: "sk-...",
  },
  deepseek: {
    label: "DeepSeek",
    model: "deepseek-chat",
    baseURL: "https://api.deepseek.com",
    keyHint: "sk-...（DeepSeek 控制台获取）",
  },
};

export function normalizeAiProvider(raw?: string | null): AiProvider {
  return raw === "deepseek" ? "deepseek" : "openai";
}

export function resolveEnvApiKey(provider: AiProvider): string | undefined {
  if (provider === "deepseek") {
    return process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
  }
  return process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
}

export function createAiClient(apiKey: string, provider: AiProvider): OpenAI {
  const meta = AI_PROVIDER_META[provider];
  return new OpenAI({
    apiKey,
    baseURL: meta.baseURL,
  });
}

export function aiModelFor(provider: AiProvider): string {
  return AI_PROVIDER_META[provider].model;
}

export function aiKeyMissingMessage(provider: AiProvider): string {
  return `请在设置页填入 ${AI_PROVIDER_META[provider].label} API Key`;
}
