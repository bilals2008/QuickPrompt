# AGENTS.md

QuickPrompt is a desktop prompt manager. The Electron shell has been removed;
this repo ships the Tauri 2 + Rust shell with a shared React UI. The migration
is complete (Phase 8 passed, upgrade-in-place release path chosen).

## Rules

Read the relevant guide before working on a change:

- Repo layout, data paths, IPC adapter: `docs/agents/repo-overview.md`
- Code style, structure, React, problem solving: `docs/agents/workflow.md`
- Commands, Cargo discipline, running the app: `docs/agents/build-and-verification.md`
- IPC/data rules, vault and backups: `docs/agents/data-and-security.md`
- UI design rules and reference links: `docs/agents/ui-design.md`
- Commits, changelog, releases/CI: `docs/agents/committing-and-releases.md`
- Cutover decision and Electron removal: `docs/agents/cutover.md`,
  `docs/agents/electron-removal.md`

Historical migration plans and ground rules: `docs/migration/README.md`.

## Start here

- Native shell: `src-tauri/` · React UI: `src/` · IPC adapter: `src/lib/api/`
- Release workflow: `.github/workflows/release.yml` (triggers on `v*` tags)
- Release notes: `src/lib/changelog.js` · `CHANGELOG.md`

## Non-negotiables

- The UI reaches native features only through `api.*` (`src/lib/api/`), never
  `window.*` directly.
- DB stays at `{app_data_dir}/QuickPrompt/quickprompt.db`; never delete user
  data and do not drift the shapes/keys the UI expects.
- Do not run two cargo builds at once. Verify with the smallest command that
  proves the change.
- Commits: one line, English, conventional prefix, no co-authors or attribution.
