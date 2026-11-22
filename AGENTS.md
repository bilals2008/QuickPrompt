# AGENTS.md

## Most important rule

For unfamiliar features, don't write from scratch. First search GitHub for
open-source projects that already solve it, compare the approaches, then get
started.

---

## What this repo is

QuickPrompt is being migrated from **Electron + Node/SQLite3** to **Tauri 2 +
Rust + rusqlite**. Both shells live here and share one Vite/React frontend:

- `electron/` — the live reference. Never delete it before the Phase 8 gate.
- `src-tauri/` — the Tauri shell. Grows phase by phase.
- `src/` — React UI, reused by both shells.
- `docs/migration/` — the phase plans. `README.md` holds the ground rules.

Ground rules, from `docs/migration/README.md`:

1. The Electron app is the behavioural reference until Phase 8. Keep it
   runnable (`npm run dev`).
2. Port one `window.*` API namespace end-to-end, then verify.
3. The DB stays at `{app_data_dir}/QuickPrompt/quickprompt.db` so existing user
   data opens unchanged.
4. No behaviour drift: return shapes, key casing and error messages must match
   what the React code already expects.
5. A phase is done only when its checklist is green; commit at that point.

## Workflow

- Read `docs/migration/README.md` and the current phase file before starting
  anything that touches more than one file.
- A source file may not grow past **800 lines**. Split the file first, moving
  the code rather than rewriting it.
- Work that does not depend on each other is done in parallel, one agent per
  piece, one set of files per piece.
- A change is not finished until it has been seen on a running app: `npm run
  dev` for the Electron reference, `cargo tauri dev` for the Tauri shell
  (start `npm run dev` first — the Tauri config uses `http://localhost:5173`
  and does not launch Vite itself).

---

## Build discipline

- Verify with the smallest command that proves the change: `cargo build` or
  `cargo clippy` inside `src-tauri/`, `npm test` or `npm run lint` at the root.
  Run the full set once, at the end — not after every edit.
- **Never run two cargo builds at the same time**: they fight over the target
  lock and `link.exe` fails with a bogus "build tools missing" error. Wait for
  one to finish before starting the next.
- After a small fix, re-run the targeted command — cargo reuses what is built.
  Do not start a fresh full build, and do not `cargo clean` mid-task.
- `cargo tauri build` only when the packaged app must actually be driven. If
  the change does not touch what the binary uses, reuse the binary already in
  `src-tauri/target`.
- If `target/` is already huge, report the size and let the reader decide about
  a clean; never delete it unasked.
- Build scratch binaries and examples only when they are about to be used, and
  remove scratch files when the task ends.

---

Project-specific rules for coding agents. Details: `docs/migration/README.md`.
Organize files properly: Keep folders and files logically structured by feature and responsibility.
- Keep folders and files well-organized, modular, and maintainable.
- Use skills for UI/UX and for the desktop-app feel.
- Never put the entire application logic in one file. Separate concerns into appropriate modules and reusable components.
- Build reusable components, hooks, utilities, and shared logic wherever appropriate. Avoid code duplication and follow consistent naming conventions.
- Use the shared `Tooltip` (`src/components/ui/tooltip.jsx`) instead of native `title` for icon-only controls and truncated text.
- Use the `find-skills` skill to discover and apply relevant skills for this project. Check already-installed skills and never install or add duplicates.
- Use semantic design tokens for colors, typography, spacing, borders, and other design properties. Never hardcode design values in components; define and reuse centralized tokens.
- Add relevant theme reference URLs and useful resource links to `AGENTS.md`.
- Follow the existing project structure, conventions, and tech stack. Avoid unnecessary files, dependencies, and architectural changes.
- Prioritize clean architecture, maintainability, performance, accessibility, and consistency.
Also, structure the design system  to support multiple themes in the future. Switching themes should instantly update the entire UI, including backgrounds, colors, borders, and other design tokens. Use centralized semantic CSS variables and theme configurations to make adding or changing themes easy without modifying individual components.

## Problem solving

- When a problem is hard to diagnose or the fix is unclear, research it before
  writing code. Do not guess, and do not settle for an outdated method.
- Use the latest stable, recommended approach. No hacks, temporary fixes or
  workarounds.
- For anything uncertain, check official sources first: Tauri, Rust crate docs,
  React/Tailwind docs. Official documentation beats random tutorials.
- Confirm the version in use before copying a solution from the web.

## React

-Avoid useEffect: Do not use React's useEffect by default. Prefer event handlers, derived state, and proper data flow. Use it only when genuinely necessary.

## Commits

- Never add a `Co-Authored-By` trailer, an "Generated with" line, or any other
  attribution to a commit. Strictly no co-authors. One line, English,
  conventional prefix (`feat(scope): ...`), and no commit body.
- Commit a change as one commit. Do not split a working tree into a series of
  small per-layer commits; separate commits are only for work that is genuinely
  unrelated.

## Design slop indicators

Do not ship these. They are the tells of generic AI-generated UI:

- Tags (pill badges, label chips used as decoration)
- Italicized words
- Instrument Serif with negative kerning (or any "editorial" font pairing)
- Over-the-top detailed UI
- Dividers (decorative rules between sections)
- Many color shades and opacities (keep one accent, one neutral ramp)
- Containers with borders (nested cards, bordered panels inside bordered panels)
- Diagrams (the more detailed, the worse)
- Code breadcrumbs (`provider / model / version` paths in UI copy)
- Section numbering (01, 02, 03 labels)

## What's New

- `src/lib/changelog.js` is the single source of truth for reader-facing release
  notes. The in-app popup (`src/features/whats-new/`) reads it, and
  `CHANGELOG.md` mirrors it for the repo and the GitHub release body.
- Before every release, add an entry at the top of `CHANGELOG` with short, plain
  sentences a non-technical user understands. Never copy commit subjects into
  it, and never show developer words in the popup.
- The startup popup shows once per newer version and never interrupts an
  active download. Settings > About and Help > What's new must always reopen
  the notes manually.

## Links

- Design tokens: `src/index.css`
- Release notes: `src/lib/changelog.js`, `CHANGELOG.md`
- Migration plans: `docs/migration/README.md`
- Release workflow: `.github/workflows/release.yml`
- shadcn/ui themes: https://ui.shadcn.com/themes
- tweakcn theme editor: https://tweakcn.com
- Tailwind CSS v4 theme variables: https://tailwindcss.com/docs/theme
- Radix Colors: https://www.radix-ui.com/colors
- Tauri v2 docs: https://v2.tauri.app/
- Tauri updater config: https://v2.tauri.app/plugin/updater/
- Skill registry: https://skills.sh/
