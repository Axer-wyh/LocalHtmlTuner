import type { ProviderMode, RuntimeConfig } from "@local-html-tuner/shared";

export const COMPANION_PORT = 17373;

let providerMode: ProviderMode = "cli";

export function getRuntimeConfig(): RuntimeConfig {
  return {
    service: {
      connected: true,
      port: COMPANION_PORT
    },
    providerMode,
    cliName: "Codex CLI",
    model: "GPT-5",
    reasoning: "High",
    projectName: "draft-studio",
    entryFile: "index.html",
    previewUrl: "http://localhost:4173/index.html"
  };
}

export function setProviderMode(mode: ProviderMode): RuntimeConfig {
  providerMode = mode;
  return getRuntimeConfig();
}
