import type { ProviderMode, RuntimeConfig, TuneRequest, TuneResponse, UndoResponse } from "@local-html-tuner/shared";

const BASE_URL = "http://127.0.0.1:17373";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    },
    ...init
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export interface CompanionClient {
  getConfig(): Promise<RuntimeConfig>;
  setProviderMode(mode: ProviderMode): Promise<RuntimeConfig>;
  tune(request: TuneRequest): Promise<TuneResponse>;
  undo(taskId: string): Promise<UndoResponse>;
}

export const companionClient: CompanionClient = {
  getConfig() {
    return fetchJson<RuntimeConfig>("/config");
  },
  setProviderMode(mode) {
    return fetchJson<RuntimeConfig>("/config/provider-mode", {
      method: "POST",
      body: JSON.stringify({ mode })
    });
  },
  tune(request) {
    return fetchJson<TuneResponse>("/tasks/tune", {
      method: "POST",
      body: JSON.stringify(request)
    });
  },
  undo(taskId) {
    return fetchJson<UndoResponse>(`/tasks/${taskId}/undo`, {
      method: "POST"
    });
  }
};
