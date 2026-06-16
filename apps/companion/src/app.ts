import Fastify, { type FastifyInstance } from "fastify";
import { isCliOnlyMode, type ProviderMode, type TuneRequest } from "@local-html-tuner/shared";
import { getRuntimeConfig, setProviderMode } from "./runtimeConfig";
import { createTuneTask, undoTuneTask } from "./taskStore";

interface ProviderModeBody {
  mode?: ProviderMode;
}

export function createApp(): FastifyInstance {
  const app = Fastify({
    logger: false
  });

  app.addHook("onSend", async (request, reply, payload) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type");

    if (request.method === "OPTIONS") {
      reply.status(204);
      return "";
    }

    return payload;
  });

  app.options("/*", async () => "");

  app.get("/health", async () => ({
    ok: true,
    service: "local-html-tuner-companion"
  }));

  app.get("/config", async () => getRuntimeConfig());

  app.post<{ Body: ProviderModeBody }>("/config/provider-mode", async (request, reply) => {
    const mode = request.body.mode;

    if (mode !== "cli" && mode !== "api") {
      return reply.status(400).send({ message: "provider mode must be cli or api" });
    }

    return setProviderMode(mode);
  });

  app.post<{ Body: TuneRequest }>("/tasks/tune", async (request, reply) => {
    const body = request.body;

    if (!body?.instruction?.trim()) {
      return reply.status(400).send({ message: "instruction is required" });
    }

    if (!body.selection) {
      return reply.status(400).send({ message: "selection is required" });
    }

    if (!isCliOnlyMode(body.providerMode)) {
      return reply.status(409).send({ message: "暂仅支持配置CLI方式" });
    }

    return createTuneTask(body);
  });

  app.post<{ Params: { taskId: string } }>("/tasks/:taskId/undo", async (request, reply) => {
    const response = undoTuneTask(request.params.taskId);

    if (!response) {
      return reply.status(404).send({ message: "task not found" });
    }

    return response;
  });

  return app;
}
