# QuickPrompt

A desktop sticky-notes-style prompt manager — create, tag, search, and copy prompts instantly.

Built with Electron + React 19 + Vite 8 + shadcn/ui + Tailwind CSS v4 + SQLite3.

## Features

- **Quick save** — FAB button to add prompts with tags
- **One-click copy** — click any prompt card to copy to clipboard
- **Favorite system** — star prompts to mark favorites, filter to show only favorites
- **Tag system** — color-coded tags with autocomplete suggestions
- **Search** — filter prompts by content or tags
- **Responsive grid** — adapts from 1 column on small screens to 4 columns on large screens
- **Multiple themes** — Light, Dark, Forest, Ocean
- **Tray/minimal mode** — lives in system tray, close hides to window (no dock icon on macOS)
- **Keyboard friendly** — tab through tags, escape to close search

## Tech Stack

| Layer | Library |
|-------|---------|
| Desktop | Electron 42 |
| UI | React 19, shadcn/ui (Radix), Tailwind CSS v4 |
| Icons | @tabler/icons-react |
| Database | SQLite3 (via `sqlite3` package) |
| Build | Vite 8 + vite-plugin-electron |
| Packaging | electron-builder 26 |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (with Electron window)
npm run dev
```

## Build

```bash
# Windows (NSIS installer)
npm run dist:win

# macOS (DMG, x64 + arm64)
npm run dist:mac

# Both platforms
npm run dist:all
```

Output goes to `release/` directory.

## Project Structure

```
electron/
  main.js          # Main process, tray, IPC handlers
  preload.js       # contextBridge (window.db API)
  database/
    db.js          # SQLite3 connection + promise wrapper
    schema.js      # Table definitions (prompts, tags)
    prompts.js     # CRUD operations
src/
  main.jsx         # React entry
  App.jsx          # Layout + sidebar + routes
  pages/
    HomePage.jsx   # Prompt list, add dialog, search, grid
    Settings.jsx   # Theme selector, about, preferences
  components/
    theme-provider.jsx  # Theme context (light/dark/forest/ocean)
    ui/                 # shadcn components
  index.css        # Tailwind v4 + theme tokens
  App.css          # App-specific styles
vite.config.js     # Vite + Electron + Tailwind config
```

## Database

SQLite3 stores data at `{userData}/QuickPrompt/quickprompt.db`.

Tables:
- **prompts** — id, content, tags (comma-separated), created_at, updated_at
- **tags** — id, name (unique)

## Themes

Four themes available in Settings:
- **Light** — clean white background
- **Dark** — deep dark background
- **Forest** — green-tinted dark theme
- **Ocean** — blue-tinted dark theme

## License

MIT
