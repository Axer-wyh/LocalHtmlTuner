# Local Html Tuner

Local Html Tuner is a Chrome MV3 extension plus a local companion service for tuning local HTML/CSS/JS prototypes from the browser.

## Current Slice

- Chrome side panel UI with dark Local Html Tuner styling.
- CLI-first model status for `Codex CLI · GPT-5 / High`.
- Element and region selection scaffold.
- Tune request flow through a local companion API.
- Mock tune result with changed files and snapshot id.
- Undo endpoint and UI action.
- API/BYOK mode is visible but intentionally disabled for MVP; clicking it shows `暂仅支持配置CLI方式`.
- Approved static prototype is preserved in `prototype/`.

## Setup

```bash
npm install
```

If the global npm cache has permission issues, use a project-local cache:

```bash
npm_config_cache=.npm-cache npm install
```

## Development

Start the local companion service:

```bash
npm run dev:companion
```

The companion listens on:

```text
http://127.0.0.1:17373
```

Start the extension side panel dev app:

```bash
npm run dev:extension
```

Build the loadable MV3 extension:

```bash
npm run build -w apps/extension
```

Then load `apps/extension/dist` from `chrome://extensions` with Developer Mode enabled.

## Prototype

The visual prototype is static and can be opened directly:

```text
prototype/index.html
```

Syntax-check the prototype script:

```bash
node --check prototype/app.js
```

## Verification

```bash
npm test
npm run typecheck
npm run build
node --check prototype/app.js
```

## GitHub

Remote repository:

```text
https://github.com/Axer-wyh/LocalHtmlTuner.git
```

This local checkout already points `origin` at that repository. Pushing requires either working Git HTTPS transport or GitHub CLI authentication.

```bash
git push -u origin main
```
