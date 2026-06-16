import Fastify, { type FastifyInstance } from "fastify";
import { isCliOnlyMode, type ProviderMode, type TuneRequest } from "@local-html-tuner/shared";
import { getRuntimeConfig, setProviderMode } from "./runtimeConfig";
import { createTuneTask, undoTuneTask } from "./taskStore";

interface ProviderModeBody {
  mode?: ProviderMode;
}

const allowedDevOrigins = new Set(["http://127.0.0.1:5173", "http://localhost:5173"]);

export function getAllowedCorsOrigin(origin?: string): string | null {
  if (!origin) {
    return null;
  }

  if (origin.startsWith("chrome-extension://")) {
    return origin;
  }

  return allowedDevOrigins.has(origin) ? origin : null;
}

export function createApp(): FastifyInstance {
  const app = Fastify({
    logger: false
  });

  app.addHook("onRequest", async (request, reply) => {
    const origin = request.headers.origin;
    const allowedOrigin = getAllowedCorsOrigin(origin);

    reply.header("Vary", "Origin");
    reply.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type");

    if (allowedOrigin) {
      reply.header("Access-Control-Allow-Origin", allowedOrigin);
    }

    if (request.method === "OPTIONS" && origin && !allowedOrigin) {
      return reply.status(403).send({ message: "origin not allowed" });
    }
  });

  app.options("/*", async (_request, reply) => {
    return reply.status(204).send();
  });

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
