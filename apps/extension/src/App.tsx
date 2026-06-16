import { useEffect, useMemo, useState } from "react";
import type { ProviderMode, RuntimeConfig, SelectionPayload, TuneResponse } from "@local-html-tuner/shared";
import { companionClient, type CompanionClient } from "./api";
import "./styles.css";

const fallbackConfig: RuntimeConfig = {
  service: {
    connected: false,
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

interface AppProps {
  apiClient?: CompanionClient;
}

type PanelMode = "sidebar" | "floating";

function Icon({ name }: { name: "settings" | "window" | "sidebar" | "cursor" | "region" | "undo" | "send" }) {
  const paths = {
    settings: (
      <>
        <path d="M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7Z" />
        <path d="M19.4 15a8.1 8.1 0 0 0 .1-1.5 8.1 8.1 0 0 0-.1-1.5l2-1.5-2-3.4-2.4 1a7.6 7.6 0 0 0-2.6-1.5L14 4h-4l-.4 2.6A7.6 7.6 0 0 0 7 8.1l-2.4-1-2 3.4 2 1.5a8.1 8.1 0 0 0-.1 1.5 8.1 8.1 0 0 0 .1 1.5l-2 1.5 2 3.4 2.4-1a7.6 7.6 0 0 0 2.6 1.5L10 23h4l.4-2.6a7.6 7.6 0 0 0 2.6-1.5l2.4 1 2-3.4-2-1.5Z" />
      </>
    ),
    window: (
      <>
        <path d="M4 5h16v14H4V5Z" />
        <path d="M4 9h16" />
        <path d="M14 5v14" />
      </>
    ),
    sidebar: (
      <>
        <path d="M4 5h16v14H4V5Z" />
        <path d="M15 5v14" />
        <path d="M7 9h5M7 12h5M7 15h5" />
      </>
    ),
    cursor: <path d="M6 3l11 10-5 .8 2.6 5.2-2.8 1.3-2.5-5.1-3.3 3V3Z" />,
    region: (
      <>
        <path d="M5 5h5M14 5h5M5 5v5M19 5v5M5 14v5M5 19h5M14 19h5M19 14v5" />
        <path d="M9 9h6v6H9V9Z" />
      </>
    ),
    undo: (
      <>
        <path d="M9 7H5v4" />
        <path d="M5 11c2.2-3 5-4.5 8.4-4.2 3.6.3 6.1 3 6.1 6.2 0 3.5-2.8 6-6.6 6H8" />
      </>
    ),
    send: (
      <>
        <path d="M4 12 21 4l-7 17-3-7-7-2Z" />
        <path d="m11 14 4-4" />
      </>
    )
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter">
      {paths[name]}
    </svg>
  );
}

function createSelection(type: SelectionPayload["type"]): SelectionPayload {
  if (type === "region") {
    return {
      type,
      label: "section.card-grid",
      domPath: "body > main > section.sample-grid",
      rect: {
        x: 48,
        y: 360,
        width: 486,
        height: 260
      },
      nearbyHtml: "<section class=\"sample-grid\">...</section>"
    };
  }

  return {
    type,
    label: "button.primary",
    domPath: "body > main > section.sample-hero > button.primary",
    text: "开始调优",
    rect: {
      x: 72,
      y: 288,
      width: 132,
      height: 40
    },
    styles: {
      backgroundColor: "#b9f08a",
      color: "#030303"
    }
  };
}

export function App({ apiClient = companionClient }: AppProps) {
  const [config, setConfig] = useState<RuntimeConfig>(fallbackConfig);
  const [panelMode, setPanelMode] = useState<PanelMode>("sidebar");
  const [selection, setSelection] = useState<SelectionPayload | null>(null);
  const [instruction, setInstruction] = useState("把这个区域的主次层级调清楚，保留当前内容。");
  const [toast, setToast] = useState<string | null>(null);
  const [messages, setMessages] = useState<string[]>(["选择页面目标后，描述你想调整的视觉、布局或交互。"]);
  const [lastTask, setLastTask] = useState<TuneResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    apiClient
      .getConfig()
      .then(setConfig)
      .catch(() => {
        setConfig(fallbackConfig);
        showToast("本地 companion 未连接");
      });
  }, [apiClient]);

  const projectLine = `${config.projectName} / ${config.entryFile}`;
  const canSend = Boolean(selection && instruction.trim() && !isRunning);
  const modeIcon = panelMode === "floating" ? "sidebar" : "window";
  const modeLabel = panelMode === "floating" ? "恢复为侧边栏" : "切换为浮窗";

  function showToast(text: string) {
    setToast(text);
    window.setTimeout(() => setToast(null), 1800);
  }

  function chooseProviderMode(mode: ProviderMode) {
    if (mode === "api") {
      showToast("暂仅支持配置CLI方式");
      return;
    }

    setConfig((current) => ({
      ...current,
      providerMode: "cli"
    }));
  }

  function selectTarget(type: SelectionPayload["type"]) {
    const nextSelection = createSelection(type);
    setSelection(nextSelection);
    showToast(type === "region" ? "已框选区域" : "已选中元素");
  }

  async function sendTuneRequest() {
    if (!canSend || !selection) {
      showToast("请先选择或框选页面目标");
      return;
    }

    setIsRunning(true);
    setMessages((current) => [...current, `你：${instruction}`, "Local Agent：创建快照，采集上下文，调用 Codex CLI。"]);

    try {
      const response = await apiClient.tune({
        projectName: config.projectName,
        entryFile: config.entryFile,
        instruction,
        selection,
        providerMode: config.providerMode
      });
      setLastTask(response);
      setMessages((current) => [
        ...current,
        `修改完成：${response.summary}`,
        `变更文件：${response.changedFiles.join(" / ")}`
      ]);
      showToast("预览已刷新");
    } catch (error) {
      setMessages((current) => [...current, error instanceof Error ? error.message : "执行失败"]);
    } finally {
      setIsRunning(false);
    }
  }

  async function undoLastTask() {
    if (!lastTask) {
      return;
    }

    const response = await apiClient.undo(lastTask.taskId);
    setMessages((current) => [...current, response.summary]);
    setLastTask(null);
    showToast("已撤销本次修改");
  }

  const statusItems = useMemo(
    () => [
      config.service.connected ? "本地服务" : "服务未连接",
      config.cliName,
      `${config.model} / ${config.reasoning}`
    ],
    [config]
  );

  return (
    <main className={`app-shell app-shell--${panelMode}`}>
      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}

      <section className="panel" aria-label="Local Html Tuner 插件面板">
        <header className="panel-head">
          <div>
            <h1>Local Html Tuner</h1>
            <p>当前项目：{projectLine}</p>
          </div>
          <div className="icon-actions">
            <button type="button" aria-label="设置" title="设置" onClick={() => showToast("设置将在下一版接入")}>
              <Icon name="settings" />
            </button>
            <button type="button" aria-label={modeLabel} title={modeLabel} onClick={() => setPanelMode(panelMode === "floating" ? "sidebar" : "floating")}>
              <Icon name={modeIcon} />
            </button>
          </div>
        </header>

        <div className="status-strip" aria-label="项目已绑定">
          {statusItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>

        <div className="provider-row" aria-label="AI 工具配置">
          <button type="button" className={config.providerMode === "cli" ? "is-active" : ""} onClick={() => chooseProviderMode("cli")}>
            CLI
          </button>
          <button type="button" onClick={() => chooseProviderMode("api")}>
            API / BYOK
          </button>
        </div>

        <nav className="tool-row" aria-label="选择与版本操作">
          <button type="button" aria-label="选择元素" title="选择元素" onClick={() => selectTarget("element")}>
            <Icon name="cursor" />
          </button>
          <button type="button" aria-label="选择区域" title="选择区域" onClick={() => selectTarget("region")}>
            <Icon name="region" />
          </button>
          <button type="button" aria-label="撤销" title="撤销" disabled={!lastTask} onClick={undoLastTask}>
            <Icon name="undo" />
          </button>
        </nav>

        <section className="selection-summary" aria-live="polite">
          <small>CURRENT TARGET</small>
          <strong>{selection ? (selection.type === "region" ? "已框选区域" : `已选 ${selection.label}`) : "还没有选中页面目标"}</strong>
          <p>
            {selection
              ? `${Math.round(selection.rect.width)} x ${Math.round(selection.rect.height)} / ${selection.domPath}`
              : "先点选一个元素，或框选一块区域，再提交修改请求。"}
          </p>
        </section>

        <section className="chat-log" aria-label="AI 会话区" aria-live="polite">
          {messages.map((message, index) => (
            <article key={`${message}-${index}`} className={index === 0 ? "message message--empty" : "message"}>
              <span>{message.startsWith("你：") ? "You" : "Local Agent"}</span>
              <p>{message}</p>
            </article>
          ))}
        </section>

        <section className="composer" aria-label="需求输入区">
          <label htmlFor="instruction">修改要求</label>
          <textarea id="instruction" rows={4} value={instruction} onChange={(event) => setInstruction(event.target.value)} />
          <div className="quick-intents">
            {["调整间距", "弱化视觉", "强化重点", "修改交互"].map((intent) => (
              <button key={intent} type="button" onClick={() => setInstruction(intent)}>
                {intent}
              </button>
            ))}
          </div>
          <button type="button" className="send-button" disabled={!canSend} onClick={sendTuneRequest}>
            {isRunning ? (
              <span>执行中</span>
            ) : (
              <>
                <Icon name="send" />
                <span>发送</span>
              </>
            )}
          </button>
        </section>
      </section>
    </main>
  );
}
