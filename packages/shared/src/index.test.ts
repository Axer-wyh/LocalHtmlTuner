import { describe, expect, it } from "vitest";
import { createMockTuneResponse, isCliOnlyMode, type TuneRequest } from "./index";

const request: TuneRequest = {
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

describe("shared protocol", () => {
  it("keeps API/BYOK outside executable MVP mode", () => {
    expect(isCliOnlyMode("cli")).toBe(true);
    expect(isCliOnlyMode("api")).toBe(false);
  });

  it("creates mock tune responses with snapshot and files", () => {
    const response = createMockTuneResponse(request);

    expect(response.taskId).toMatch(/^task-/);
    expect(response.snapshotId).toMatch(/^snapshot-/);
    expect(response.changedFiles).toEqual(["index.html", "styles.css"]);
    expect(response.progress.every((step) => step.status === "done")).toBe(true);
  });
});
