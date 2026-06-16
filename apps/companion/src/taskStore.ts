import {
  createMockTuneResponse,
  type TuneRequest,
  type TuneResponse,
  type UndoResponse
} from "@local-html-tuner/shared";

const taskResponses = new Map<string, TuneResponse>();

export function createTuneTask(request: TuneRequest): TuneResponse {
  const response = createMockTuneResponse(request);
  taskResponses.set(response.taskId, response);
  return response;
}

export function undoTuneTask(taskId: string): UndoResponse | null {
  const task = taskResponses.get(taskId);

  if (!task) {
    return null;
  }

  return {
    taskId,
    snapshotId: task.snapshotId,
    restored: true,
    summary: "已恢复到本次修改前快照。"
  };
}

export function clearTaskStore(): void {
  taskResponses.clear();
}
