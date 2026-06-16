import { afterEach, describe, expect, it } from "vitest";
import { createApp, getAllowedCorsOrigin } from "./app";
import { clearTaskStore } from "./taskStore";
import type { TuneRequest } from "@local-html-tuner/shared";

const tuneRequest: TuneRequest = {
  projectName: "draft-studio",
  entryFile: "index.html",
  instruction: "把主按钮弱化一点",
  providerMode: "cli",
  selection: {
    type: "element",
    label: "button.primary",
    domPath: "body > main > button.primary",
    text: "开始调优",
    rect: {
      x: 24,
      y: 120,
      width: 120,
      height: 40
    }
  }
};

describe("companion app", () => {
  afterEach(() => {
    clearTaskStore();
  });

  it("returns health status", async () => {
    const app = createApp();
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      service: "local-html-tuner-companion"
    });
  });

  it("allows only extension and local dev CORS origins", () => {
    expect(getAllowedCorsOrigin("chrome-extension://abc")).toBe("chrome-extension://abc");
    expect(getAllowedCorsOrigin("http://127.0.0.1:5173")).toBe("http://127.0.0.1:5173");
    expect(getAllowedCorsOrigin("http://localhost:5173")).toBe("http://localhost:5173");
    expect(getAllowedCorsOrigin("https://example.com")).toBeNull();
  });

  it("rejects browser preflights from arbitrary origins", async () => {
    const app = createApp();
    const response = await app.inject({
      method: "OPTIONS",
      url: "/tasks/tune",
      headers: {
        origin: "https://example.com",
        "access-control-request-method": "POST"
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("returns default CLI config", async () => {
    const app = createApp();
    const response = await app.inject({ method: "GET", url: "/config" });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.providerMode).toBe("cli");
    expect(body.cliName).toBe("Codex CLI");
    expect(body.model).toBe("GPT-5");
  });

  it("updates provider mode", async () => {
    const app = createApp();
    const response = await app.inject({
      method: "POST",
      url: "/config/provider-mode",
      payload: { mode: "api" }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().providerMode).toBe("api");
  });

  it("returns mock tune result for CLI requests", async () => {
    const app = createApp();
    const response = await app.inject({
      method: "POST",
      url: "/tasks/tune",
      payload: tuneRequest
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.snapshotId).toMatch(/^snapshot-/);
    expect(body.changedFiles).toEqual(["index.html", "styles.css"]);
  });

  it("restores existing task snapshots", async () => {
    const app = createApp();
    const tuneResponse = await app.inject({
      method: "POST",
      url: "/tasks/tune",
      payload: tuneRequest
    });
    const taskId = tuneResponse.json().taskId;
    const undoResponse = await app.inject({
      method: "POST",
      url: `/tasks/${taskId}/undo`
    });

    expect(undoResponse.statusCode).toBe(200);
    expect(undoResponse.json()).toMatchObject({
      taskId,
      restored: true
    });
  });
});
