# Local Html Tuner

Chrome MV3 extension + local companion service for tuning local HTML/CSS/JS prototypes from a browser side panel.

The current version is an MVP vertical slice: the extension UI, target selection scaffold, local API, mock tune result, and undo flow are wired end to end. Real file patching and real Codex CLI execution are not enabled yet.

## Repository Layout

```text
apps/
  companion/   Local Fastify service on 127.0.0.1:17373
  extension/   Chrome MV3 extension side panel
packages/
  shared/      Shared request, response, and runtime types
prototype/     Approved static product/UI prototype
docs/          Product docs and implementation plan
```

## Requirements

- Node.js 24+
- npm 11+
- Chrome 114+
- Git with SSH access to GitHub if you want to push changes

## Install From GitHub

```bash
git clone git@github.com:Axer-wyh/LocalHtmlTuner.git
cd LocalHtmlTuner
npm install
```

If your npm user cache has permission issues:

```bash
npm_config_cache=.npm-cache npm install
```

## Run The Full Local Test Flow

Use three terminals.

Terminal 1: start the companion service.

```bash
npm run dev:companion
```

This command builds the shared workspace package automatically before starting the service.

Expected service URL:

```text
http://127.0.0.1:17373
```

Terminal 2: serve the sample prototype page.

```bash
npm run dev:prototype
```

Open:

```text
http://127.0.0.1:4173/
```

Terminal 3: build the Chrome extension.

```bash
npm run build -w apps/extension
```

This command also builds the shared workspace package automatically, so a fresh clone does not need a separate shared build step.

Load the extension in Chrome:

1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Click `Load unpacked`.
4. Select `apps/extension/dist`.
5. Open the extension side panel from Chrome.

Manual checks:

- The panel title is `Local Html Tuner`.
- Status shows `本地服务`, `Codex CLI`, and `GPT-5 / High`.
- Clicking `API / BYOK` shows `暂仅支持配置CLI方式`.
- `发送` is disabled before selecting a target.
- Click the select-element icon, then `发送`.
- The chat shows a mock result with `index.html / styles.css`.
- The undo icon becomes available and restores the mock snapshot state.

## Verification

```bash
npm test
npm run typecheck
npm run build
npm audit
node --check prototype/app.js
```

## Security Notes

- The extension does not request `file:///*` access.
- The extension does not request unused `activeTab`, `scripting`, or `storage` permissions.
- The companion service only listens on `127.0.0.1`.
- Browser CORS is restricted to Chrome extension origins and local dev origins.
- API/BYOK is UI-only in this MVP; no API key is stored or sent.
- Real file modification is not enabled in this slice.
- Do not commit `.env`, tokens, API keys, private keys, or local cache directories.

## Current Scope

Implemented:

- Chrome side panel UI
- Local companion API
- Selection scaffold
- Mock tune result
- Undo flow
- API/BYOK disabled toast
- Static visual prototype

Not implemented yet:

- Real Codex CLI invocation
- Real HTML/CSS/JS patching
- Snapshot files on disk
- Secure local settings storage
- GitHub PR workflow from the extension UI
