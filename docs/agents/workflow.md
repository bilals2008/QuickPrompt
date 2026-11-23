# Workflow

## Before you start

- For unfamiliar features, do not write from scratch. Search GitHub for an
  open-source project that already solves it, compare approaches, then start.
- Read `docs/migration/README.md` and the relevant phase file before touching
  more than one file (the phase docs are the historical ground rules).

## Structure and code style

- A source file may not grow past **800 lines**. Split it first, moving code
  rather than rewriting it.
- Keep files and folders organized by feature and responsibility. No app-wide
  logic in one file: separate concerns into modules, hooks and reusable
  components. Avoid duplication and follow the existing naming conventions.
- Work that does not depend on itself is done in parallel: one agent per piece,
  one set of files per piece.
- Use the shared `Tooltip` (`src/components/ui/tooltip.jsx`) instead of native
  `title` for icon-only controls and truncated text.
- Use semantic design tokens for colour, typography, spacing and borders;
  never hardcode design values in components. The design system must support
  multiple themes: switching themes instantly updates backgrounds, colours,
  borders and all tokens via centralized CSS variables.
- Use skills for UI/UX and desktop-app feel. Discover with `find-skills`;
  never install duplicates.

## React

- Do not use `useEffect` by default. Prefer event handlers, derived state and
  proper data flow. Use it only when genuinely necessary.

## Problem solving

- When a problem is hard to diagnose, research before writing code. Do not
  guess or settle for an outdated method.
- Use the latest stable, recommended approach. No hacks, temporary fixes or
  workarounds.
- Check official sources first (Tauri, Rust crate docs, React/Tailwind docs).
  Confirm the version in use before copying a solution from the web.
