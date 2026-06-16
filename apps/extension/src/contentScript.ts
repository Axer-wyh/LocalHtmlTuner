import type { SelectionPayload } from "@local-html-tuner/shared";

const OVERLAY_ID = "local-html-tuner-selection-overlay";

function ensureOverlay(): HTMLDivElement {
  const existing = document.getElementById(OVERLAY_ID);

  if (existing instanceof HTMLDivElement) {
    return existing;
  }

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.style.position = "fixed";
  overlay.style.inset = "24px";
  overlay.style.border = "1px solid #b9f08a";
  overlay.style.pointerEvents = "none";
  overlay.style.zIndex = "2147483647";
  overlay.style.boxShadow = "0 0 0 9999px rgba(3, 3, 3, 0.14)";
  overlay.style.display = "none";
  document.documentElement.append(overlay);
  return overlay;
}

function createFallbackSelection(type: SelectionPayload["type"]): SelectionPayload {
  const target = document.querySelector("button, [role='button'], a, main, body") ?? document.body;
  const rect = target.getBoundingClientRect();
  const label = type === "region" ? "viewport region" : target.tagName.toLowerCase();

  return {
    type,
    label,
    domPath: label,
    text: target.textContent?.trim().slice(0, 120),
    rect: {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    },
    nearbyHtml: target instanceof HTMLElement ? target.outerHTML.slice(0, 1200) : undefined
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "local-html-tuner:start-selection") {
    return false;
  }

  const selectionType = message.selectionType === "region" ? "region" : "element";
  const overlay = ensureOverlay();
  overlay.style.display = "block";

  window.setTimeout(() => {
    overlay.style.display = "none";
    sendResponse({ selection: createFallbackSelection(selectionType) });
  }, 160);

  return true;
});
