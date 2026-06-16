const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const state = {
  page: "prototype",
  mode: "idle",
  panelMode: "sidebar",
  selection: null,
  taskComplete: false,
  dragging: false,
  dragStart: null,
};

const workspace = $("#workspace");
const previewStage = $("#previewStage");
const targetRect = $("#targetRect");
const targetLabel = $("#targetLabel");
const regionRect = $("#regionRect");
const regionSize = $("#regionSize");
const floatingToolbar = $("#floatingToolbar");
const selectorToast = $("#selectorToast");
const selectionSummary = $("#selectionSummary");
const chatLog = $("#chatLog");
const requestInput = $("#requestInput");
const sendButton = $("#sendButton");
const composer = $(".composer");
const undoButton = $("#undoButton");

function showToast(text) {
  selectorToast.textContent = text;
  selectorToast.classList.add("is-visible");
  window.setTimeout(() => selectorToast.classList.remove("is-visible"), 1800);
}

function setPage(page) {
  state.page = page;
  $("#prototypePage").classList.toggle("is-active", page === "prototype");
  $("#landingPage").classList.toggle("is-active", page === "landing");
  $$(".nav-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.pageTarget === page);
  });
  if (page === "prototype") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function updatePanelModeButton() {
  const button = $("#panelModeButton");
  const icon = state.panelMode === "window" ? "#icon-sidebar" : "#icon-window";
  const label = state.panelMode === "window" ? "恢复为侧边栏" : "切换为浮窗";
  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);
  button.innerHTML = `<svg aria-hidden="true"><use href="${icon}"></use></svg>`;
}

function updateSendButton(running = false) {
  sendButton.innerHTML = running
    ? "<span>执行中</span>"
    : '<svg aria-hidden="true"><use href="#icon-send"></use></svg><span>发送</span>';
}

function clearSelectionVisuals() {
  targetRect.classList.remove("is-visible", "is-confirmed");
  regionRect.classList.remove("is-visible", "is-confirmed");
  floatingToolbar.classList.remove("is-visible");
}

function setMode(mode) {
  state.mode = mode;
  state.dragging = false;
  previewStage.classList.toggle("is-selecting", mode !== "idle");
  $("#selectElementButton").classList.toggle("is-active", mode === "element");
  $("#selectRegionButton").classList.toggle("is-active", mode === "region");
  clearSelectionVisuals();

  if (mode === "element") {
    showToast("点击页面元素作为修改目标，Esc 退出");
  } else if (mode === "region") {
    showToast("拖拽选择一个页面区域，Esc 退出");
  } else {
    showToast("选择模式已关闭");
  }
}

function stageRelativeRect(element) {
  const stageBox = previewStage.getBoundingClientRect();
  const box = element.getBoundingClientRect();
  return {
    left: box.left - stageBox.left,
    top: box.top - stageBox.top,
    width: box.width,
    height: box.height,
  };
}

function drawTarget(rect, label, confirmed = false) {
  targetRect.style.left = `${rect.left}px`;
  targetRect.style.top = `${rect.top}px`;
  targetRect.style.width = `${rect.width}px`;
  targetRect.style.height = `${rect.height}px`;
  targetLabel.textContent = label;
  targetRect.classList.add("is-visible");
  targetRect.classList.toggle("is-confirmed", confirmed);
  regionRect.classList.remove("is-visible");
}

function drawToolbar(rect) {
  floatingToolbar.style.left = `${Math.max(12, rect.left)}px`;
  floatingToolbar.style.top = `${Math.max(12, rect.top + rect.height + 10)}px`;
  floatingToolbar.classList.add("is-visible");
}

function updateSummary(selection) {
  const headline = selection.type === "region" ? "已框选区域" : `已选 ${selection.label}`;
  const detail =
    selection.type === "region"
      ? `${Math.round(selection.width)} x ${Math.round(selection.height)} / 识别 6 个主要节点`
      : `${selection.kind} / ${Math.round(selection.width)} x ${Math.round(selection.height)} / 采集 DOM 路径和计算样式`;

  selectionSummary.innerHTML = `
    <div>
      <p class="micro">CURRENT TARGET</p>
      <strong>${headline}</strong>
    </div>
    <p>${detail}</p>
  `;
}

function confirmSelection(selection) {
  state.selection = selection;
  updateSummary(selection);
  setMode("idle");
  composer.classList.remove("has-error");
}

function appendMessage(role, title, text) {
  const article = document.createElement("article");
  article.className = `message ${role}`;
  const label = document.createElement("span");
  label.className = "message-role";
  label.textContent = title;
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  article.append(label, paragraph);
  chatLog.append(article);
  chatLog.scrollTop = chatLog.scrollHeight;
  return article;
}

function appendProgress() {
  const article = document.createElement("article");
  article.className = "message assistant";
  article.innerHTML = `
    <span class="message-role">Local Agent</span>
    <p>任务已发送到本地 companion 服务。</p>
    <ul class="progress-list">
      <li><span class="step-dot"></span><span>创建修改前快照</span></li>
      <li><span class="step-dot"></span><span>采集选区上下文</span></li>
      <li><span class="step-dot"></span><span>调用 Codex CLI</span></li>
      <li><span class="step-dot"></span><span>应用补丁并刷新预览</span></li>
    </ul>
  `;
  chatLog.append(article);
  chatLog.scrollTop = chatLog.scrollHeight;
  return $$(".progress-list li", article);
}

function appendResult() {
  const article = document.createElement("article");
  article.className = "message assistant result-card";
  article.innerHTML = `
    <span class="message-role">修改完成</span>
    <p>已调整目标区域的视觉层级，并保留当前内容结构。</p>
    <ul>
      <li>index.html</li>
      <li>styles.css</li>
    </ul>
    <div class="result-actions">
      <button type="button" data-open-compare>查看对比</button>
      <button type="button" data-continue-tune>继续微调</button>
      <button type="button" data-undo-result>撤销本次修改</button>
    </div>
  `;
  chatLog.append(article);
  chatLog.scrollTop = chatLog.scrollHeight;
  state.taskComplete = true;
  undoButton.disabled = false;
}

function runTask() {
  const request = requestInput.value.trim();
  if (!state.selection) {
    composer.classList.add("has-error");
    showToast("请先选择或框选页面目标");
    return;
  }
  if (!request) {
    composer.classList.add("has-error");
    $("#composerError").textContent = "请输入修改要求。";
    return;
  }

  composer.classList.remove("has-error");
  sendButton.disabled = true;
  updateSendButton(true);
  appendMessage("user", "You", request);
  const steps = appendProgress();
  let index = 0;

  const timer = window.setInterval(() => {
    steps.forEach((step, stepIndex) => {
      step.classList.toggle("is-running", stepIndex === index);
      step.classList.toggle("is-done", stepIndex < index);
    });
    index += 1;

    if (index > steps.length) {
      window.clearInterval(timer);
      steps.forEach((step) => {
        step.classList.remove("is-running");
        step.classList.add("is-done");
      });
      appendResult();
      sendButton.disabled = false;
      updateSendButton(false);
      showToast("预览已刷新，可以查看对比或撤销");
    }
  }, 520);
}

function openDrawer(drawerId) {
  $$(".drawer").forEach((drawer) => drawer.classList.remove("is-open"));
  $(drawerId).classList.add("is-open");
}

function closeDrawers() {
  $$(".drawer").forEach((drawer) => drawer.classList.remove("is-open"));
}

function undoTask() {
  if (!state.taskComplete) return;
  state.taskComplete = false;
  undoButton.disabled = true;
  appendMessage("assistant", "Local Agent", "已恢复到本次修改前快照。");
  closeDrawers();
}

function handleSelectableMove(event) {
  if (state.mode !== "element") return;
  const target = event.target.closest("[data-selectable]");
  if (!target || !previewStage.contains(target)) return;
  const rect = stageRelativeRect(target);
  drawTarget(rect, target.dataset.selectable, false);
}

function handleSelectableClick(event) {
  if (state.mode !== "element") return;
  const target = event.target.closest("[data-selectable]");
  if (!target || !previewStage.contains(target)) return;
  event.preventDefault();
  event.stopPropagation();
  const rect = stageRelativeRect(target);
  const selection = {
    type: "element",
    label: target.dataset.selectable,
    kind: target.dataset.kind || "页面元素",
    width: rect.width,
    height: rect.height,
  };
  drawTarget(rect, selection.label, true);
  drawToolbar(rect);
  state.pendingSelection = selection;
}

function pointFromEvent(event) {
  const box = previewStage.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(event.clientX - box.left, box.width)),
    y: Math.max(0, Math.min(event.clientY - box.top, box.height)),
  };
}

function drawRegion(start, current, confirmed = false) {
  const left = Math.min(start.x, current.x);
  const top = Math.min(start.y, current.y);
  const width = Math.abs(start.x - current.x);
  const height = Math.abs(start.y - current.y);
  regionRect.style.left = `${left}px`;
  regionRect.style.top = `${top}px`;
  regionRect.style.width = `${width}px`;
  regionRect.style.height = `${height}px`;
  regionSize.textContent = `${Math.round(width)} x ${Math.round(height)}`;
  regionRect.classList.add("is-visible");
  regionRect.classList.toggle("is-confirmed", confirmed);
  targetRect.classList.remove("is-visible");
  return { left, top, width, height };
}

previewStage.addEventListener("mousemove", handleSelectableMove);
previewStage.addEventListener("click", handleSelectableClick);

previewStage.addEventListener("mousedown", (event) => {
  if (state.mode !== "region") return;
  state.dragging = true;
  state.dragStart = pointFromEvent(event);
  drawRegion(state.dragStart, state.dragStart);
});

previewStage.addEventListener("mousemove", (event) => {
  if (state.mode !== "region" || !state.dragging) return;
  drawRegion(state.dragStart, pointFromEvent(event));
});

previewStage.addEventListener("mouseup", (event) => {
  if (state.mode !== "region" || !state.dragging) return;
  state.dragging = false;
  const rect = drawRegion(state.dragStart, pointFromEvent(event), true);
  if (rect.width < 40 || rect.height < 40) {
    showToast("范围过小，请重新框选");
    regionRect.classList.remove("is-visible");
    return;
  }
  state.pendingSelection = {
    type: "region",
    label: "框选区域",
    width: rect.width,
    height: rect.height,
  };
  drawToolbar(rect);
});

$("#selectElementButton").addEventListener("click", () => setMode("element"));
$("#selectRegionButton").addEventListener("click", () => setMode("region"));
$("#confirmSelection").addEventListener("click", () => {
  if (state.pendingSelection) confirmSelection(state.pendingSelection);
});
$("#expandSelection").addEventListener("click", () => {
  if (!state.pendingSelection) return;
  state.pendingSelection.label =
    state.pendingSelection.type === "region" ? "父级区域 section.card-grid" : "section.hero";
  confirmSelection(state.pendingSelection);
});
$("#cancelSelection").addEventListener("click", () => setMode("idle"));
$("#panelModeButton").addEventListener("click", () => {
  state.panelMode = state.panelMode === "sidebar" ? "window" : "sidebar";
  workspace.classList.toggle("is-window-mode", state.panelMode === "window");
  updatePanelModeButton();
});
$("#settingsButton").addEventListener("click", () => openDrawer("#settingsDrawer"));
$("#undoButton").addEventListener("click", undoTask);
$("#sendButton").addEventListener("click", runTask);
$("#refreshPreview").addEventListener("click", () => showToast("预览页面已刷新"));

$$("[data-close-drawer]").forEach((button) => button.addEventListener("click", closeDrawers));

$$("[data-page-target]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    setPage(button.dataset.pageTarget);
  });
});

$$("[data-intent]").forEach((button) => {
  button.addEventListener("click", () => {
    const prefix = requestInput.value.trim();
    requestInput.value = prefix ? `${prefix}，${button.dataset.intent}` : button.dataset.intent;
    requestInput.focus();
  });
});

chatLog.addEventListener("click", (event) => {
  if (event.target.matches("[data-open-compare]")) openDrawer("#compareDrawer");
  if (event.target.matches("[data-undo-result]")) undoTask();
  if (event.target.matches("[data-continue-tune]")) requestInput.focus();
});

$$("[data-compare-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    $$(".compare-tabs button").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    const canvas = $("#compareCanvas");
    canvas.classList.remove("is-after", "is-split");
    if (button.dataset.compareMode === "after") canvas.classList.add("is-after");
    if (button.dataset.compareMode === "split") canvas.classList.add("is-split");
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMode("idle");
    closeDrawers();
  }
});
