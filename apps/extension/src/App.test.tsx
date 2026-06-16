import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RuntimeConfig, TuneRequest, TuneResponse, UndoResponse } from "@local-html-tuner/shared";
import { App } from "./App";
import type { CompanionClient } from "./api";

const config: RuntimeConfig = {
  service: {
    connected: true,
    port: 17373
  },
  providerMode: "cli",
  cliName: "Codex CLI",
  model: "GPT-5",
  reasoning: "High",
  projectName: "draft-studio",
  entryFile: "index.html",
  previewUrl: "http://localhost:4173/index.html"
};

function createClient(): CompanionClient {
  return {
    getConfig: vi.fn(async () => config),
    setProviderMode: vi.fn(async () => config),
    tune: vi.fn(async (_request: TuneRequest): Promise<TuneResponse> => ({
      taskId: "task-1",
      snapshotId: "snapshot-1",
      summary: "已完成模拟修改",
      changedFiles: ["index.html", "styles.css"],
      progress: []
    })),
    undo: vi.fn(async (taskId: string): Promise<UndoResponse> => ({
      taskId,
      snapshotId: "snapshot-1",
      restored: true,
      summary: "已恢复到本次修改前快照。"
    }))
  };
}

describe("App", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows CLI-only toast when clicking API/BYOK", async () => {
    render(<App apiClient={createClient()} />);

    fireEvent.click(screen.getByRole("button", { name: "API / BYOK" }));

    expect(await screen.findByRole("status")).toHaveTextContent("暂仅支持配置CLI方式");
  });

  it("keeps send disabled before target selection", async () => {
    render(<App apiClient={createClient()} />);

    await waitFor(() => expect(screen.getByText("当前项目：draft-studio / index.html")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "发送" })).toBeDisabled();
  });

  it("enables sending after selecting a target", async () => {
    const client = createClient();
    render(<App apiClient={client} />);

    fireEvent.click(screen.getByRole("button", { name: "选择元素" }));
    fireEvent.click(screen.getByRole("button", { name: "发送" }));

    await waitFor(() => expect(client.tune).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/修改完成/)).toBeInTheDocument();
  });
});
