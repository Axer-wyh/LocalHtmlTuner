export type ProviderMode = "cli" | "api";

export type SelectionType = "element" | "region";

export interface SelectionPayload {
  type: SelectionType;
  label: string;
  domPath: string;
  text?: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  styles?: Record<string, string>;
  nearbyHtml?: string;
}

export interface RuntimeConfig {
  service: {
    connected: boolean;
    port: number;
  };
  providerMode: ProviderMode;
  cliName: string;
  model: string;
  reasoning: "Low" | "Medium" | "High";
  projectName: string;
  entryFile: string;
  previewUrl: string;
}

export interface TuneRequest {
  projectName: string;
  entryFile: string;
  instruction: string;
  selection: SelectionPayload;
  providerMode: ProviderMode;
}

export interface TuneProgressStep {
  id: string;
  label: string;
  status: "pending" | "running" | "done";
}

export interface TuneResponse {
  taskId: string;
  snapshotId: string;
  summary: string;
  changedFiles: string[];
  progress: TuneProgressStep[];
}

export interface UndoResponse {
  taskId: string;
  snapshotId: string;
  restored: boolean;
  summary: string;
}

export function isCliOnlyMode(mode: ProviderMode): boolean {
  return mode === "cli";
}

export function createMockTuneResponse(request: TuneRequest): TuneResponse {
  const stamp = `${Date.now()}`;

  return {
    taskId: `task-${stamp}`,
    snapshotId: `snapshot-${stamp}`,
    summary: `已根据「${request.selection.label}」的局部上下文生成模拟修改结果。`,
    changedFiles: [request.entryFile, "styles.css"],
    progress: [
      { id: "snapshot", label: "创建修改前快照", status: "done" },
      { id: "context", label: "采集选区上下文", status: "done" },
      { id: "agent", label: "调用 Codex CLI", status: "done" },
      { id: "patch", label: "应用补丁并刷新预览", status: "done" }
    ]
  };
}
