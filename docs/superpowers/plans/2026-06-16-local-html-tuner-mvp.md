# Local Html Tuner MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first runnable Chrome MV3 + local companion vertical slice for Local Html Tuner.

**Architecture:** Use an npm workspace with three focused units: the Chrome extension UI, the local companion service, and shared request/response types. The first slice keeps AI execution mocked behind a stable API so the extension can exercise project state, selection payloads, tune requests, result display, API/BYOK toast behavior, and undo without touching real user files yet.

**Tech Stack:** npm workspaces, TypeScript, Vite, React, Fastify, Vitest, Chrome Manifest V3.

---

## File Structure

- Create `package.json`: root workspace scripts for build, test, typecheck, dev.
- Create `tsconfig.base.json`: shared TypeScript compiler defaults.
- Create `.gitignore`: local dependency, build, log, and environment exclusions.
- Create `packages/shared`: shared TypeScript types and validation helpers.
- Create `apps/companion`: Fastify local service with health, config, tune, undo endpoints.
- Create `apps/extension`: MV3 manifest, background/content scripts, React side panel UI.
- Move `index.html`, `styles.css`, and `app.js` into `prototype/`: preserve the approved visual prototype.
- Keep `docs/product/*`: PRD and prototype documentation remain the source of product behavior.

## Task 1: Repository Baseline

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `tsconfig.base.json`
- Modify: none

- [ ] **Step 1: Initialize workspace metadata**

Create root package metadata with scripts:

```json
{
  "name": "local-html-tuner",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "dev:companion": "npm run dev -w apps/companion",
    "dev:extension": "npm run dev -w apps/extension"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.268",
    "@types/node": "^24.0.3",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.8.3",
    "vite": "^7.0.0",
    "vitest": "^3.2.3"
  }
}
```

- [ ] **Step 2: Add TypeScript base config**

Create strict shared compiler settings:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- [ ] **Step 3: Add ignore rules**

Create `.gitignore`:

```gitignore
node_modules/
dist/
.DS_Store
*.log
.env
.env.*
!.env.example
.local-html-tuner/
```

- [ ] **Step 4: Verify metadata**

Run: `npm install`

Expected: dependency installation succeeds and creates `package-lock.json`.

## Task 2: Shared Protocol Package

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/index.test.ts`

- [ ] **Step 1: Define package entry**

Create `packages/shared/package.json` with build, typecheck, and test scripts.

- [ ] **Step 2: Write protocol types**

Define `SelectionPayload`, `TuneRequest`, `TuneResponse`, `UndoResponse`, `RuntimeConfig`, and `ProviderMode`. Include `createMockTuneResponse()` and `isCliOnlyMode()` helpers.

- [ ] **Step 3: Add tests**

Test that API/BYOK is not executable in MVP and that mock tune responses include snapshot id and changed files.

- [ ] **Step 4: Verify shared package**

Run: `npm test -w packages/shared`

Expected: Vitest passes.

## Task 3: Companion Service MVP

**Files:**
- Create: `apps/companion/package.json`
- Create: `apps/companion/tsconfig.json`
- Create: `apps/companion/src/server.ts`
- Create: `apps/companion/src/app.ts`
- Create: `apps/companion/src/runtimeConfig.ts`
- Create: `apps/companion/src/taskStore.ts`
- Create: `apps/companion/src/app.test.ts`

- [ ] **Step 1: Define Fastify package**

Use `fastify` for HTTP serving and Vitest for API tests.

- [ ] **Step 2: Implement runtime config**

Default config:

```ts
{
  providerMode: "cli",
  cliName: "Codex CLI",
  model: "GPT-5",
  reasoning: "High",
  projectName: "draft-studio",
  entryFile: "index.html"
}
```

- [ ] **Step 3: Implement routes**

Routes:
- `GET /health`
- `GET /config`
- `POST /config/provider-mode`
- `POST /tasks/tune`
- `POST /tasks/:taskId/undo`

API/BYOK mode must return a normal config state but no tune execution; the extension is responsible for showing `暂仅支持配置CLI方式` on mode click.

- [ ] **Step 4: Add route tests**

Tests:
- health returns ok.
- config returns CLI default.
- provider mode can be set to api.
- tune request returns a mock response with changed files.
- undo succeeds for an existing task id.

- [ ] **Step 5: Verify companion**

Run: `npm test -w apps/companion`

Expected: all route tests pass.

## Task 4: Extension MVP

**Files:**
- Create: `apps/extension/package.json`
- Create: `apps/extension/tsconfig.json`
- Create: `apps/extension/index.html`
- Create: `apps/extension/vite.config.ts`
- Create: `apps/extension/public/manifest.json`
- Create: `apps/extension/src/background.ts`
- Create: `apps/extension/src/contentScript.ts`
- Create: `apps/extension/src/api.ts`
- Create: `apps/extension/src/App.tsx`
- Create: `apps/extension/src/main.tsx`
- Create: `apps/extension/src/styles.css`
- Create: `apps/extension/src/App.test.tsx`

- [ ] **Step 1: Define MV3 package**

Use Vite React for the side panel app and compile background/content scripts in the same build.

- [ ] **Step 2: Implement API client**

Client calls `http://127.0.0.1:17373` for health, config, tune, and undo.

- [ ] **Step 3: Implement UI**

Build the dark side panel surface with:
- title `Local Html Tuner`
- current project `draft-studio / index.html`
- CLI model status in the bound-project status area
- icon-only controls for settings, floating mode, select element, select region, undo
- no compare button in the main toolbar
- message composer with send icon and `发送`
- provider mode segmented control where API/BYOK click shows toast `暂仅支持配置CLI方式`

- [ ] **Step 4: Add content script selection scaffold**

Content script listens for element and region selection messages and injects non-destructive selection overlays. The first MVP returns deterministic selection payloads when full page hit-testing is not available.

- [ ] **Step 5: Add UI tests**

Tests:
- API/BYOK click shows the CLI-only toast.
- send button is disabled before a target is selected.
- selecting mock target enables sending.

- [ ] **Step 6: Verify extension**

Run: `npm test -w apps/extension`

Expected: UI tests pass.

## Task 5: Prototype Preservation

**Files:**
- Create: `prototype/index.html`
- Create: `prototype/styles.css`
- Create: `prototype/app.js`
- Modify: root documentation if needed
- Delete: root `index.html`, `styles.css`, `app.js` after migration

- [ ] **Step 1: Move approved prototype**

Move the static prototype files into `prototype/` without changing visual behavior.

- [ ] **Step 2: Verify prototype syntax**

Run: `node --check prototype/app.js`

Expected: no syntax errors.

## Task 6: Full Verification And Version Prep

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document local commands**

README must include:
- `npm install`
- `npm run dev:companion`
- `npm run dev:extension`
- `npm test`
- `npm run typecheck`
- `npm run build`

- [ ] **Step 2: Run full checks**

Run:

```bash
npm test
npm run typecheck
npm run build
node --check prototype/app.js
git status -sb
```

Expected: all project checks pass; git status shows only intended project files.

- [ ] **Step 3: Commit locally**

Run:

```bash
git add .gitignore README.md package.json package-lock.json tsconfig.base.json apps packages prototype docs
git commit -m "feat: scaffold local html tuner mvp"
```

Expected: one local commit containing the MVP scaffold.

- [ ] **Step 4: Publish when GitHub transport is available**

Run after `gh` is installed/authenticated or Git HTTPS proxy is fixed:

```bash
git push -u origin main
```

Expected: `Axer-wyh/LocalHtmlTuner` receives the initial project history.

## Self-Review

- Spec coverage: this plan covers MV3 extension shape, side panel and floating state, local companion API, CLI-first model config, API/BYOK disabled toast, selection payloads, tune execution, undo, and GitHub version prep.
- Deferred intentionally: real file patch application, real Codex CLI invocation, screenshot diffing, secure BYOK storage, and full GitHub PR workflow are second-slice work after the first API and UI contract is verified.
- Placeholder scan: no TBD/TODO/fill-in-later steps remain; deferred items are explicitly scoped out of MVP slice one.
