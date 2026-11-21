# Phase 0 — Scaffold & Baseline

**Goal:** a running Electron baseline here, plus an empty Tauri shell pointed at the same Vite frontend. No feature work.

## Steps

1. `npm install` in this folder; confirm `npm run dev` launches the Electron app unchanged.
2. Tag this commit `baseline-electron` — it is the reference for every parity check.
3. Install the Tauri CLI: `cargo install tauri-cli --version "^2"`.
4. `cargo tauri init` at the repo root:
   - frontend dist: `../dist`
   - dev URL: `http://localhost:5173`
   - before-dev command: `npm run dev` **disabled for now** (Electron owns the dev loop)
5. In `src-tauri/tauri.conf.json`: window title `QuickPrompt`, matching default size, `decorations: true`.
6. Run `cargo tauri dev` with the Vite dev server started separately; confirm the React UI renders in the Tauri window.
7. Add `src-tauri/target/` to `.gitignore`.

## Done when

- [x] `npm run dev` still runs the Electron app.
- [x] `cargo tauri dev` shows the same React UI in a Tauri window.
- [x] Baseline commit tagged (`baseline-electron`, commit `42e58f2`).

## Notes

- Keep `vite-plugin-electron` until Phase 8; both shells share the Vite build for now.
- Do not delete `electron/` — it is the live reference. It is removed only after the Phase 8 gate.
- Step 4 was done by hand instead of `cargo tauri init` (which refuses a non-empty `src-tauri/`): same files, with the Electron window geometry (500×700, min 360×400, max width 500, not maximizable).
- Tauri CLI 2.12.6 via `cargo install tauri-cli`; Rust toolchain 1.99.
- Expected in this phase: the UI renders but data calls fail (`getPromptsPaginated` undefined) because `window.*` IPC is still Electron-only. That is Phase 1.
