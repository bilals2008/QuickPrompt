<div align="center">

# QuickPrompt

**A desktop sticky-notes-style prompt manager — create, tag, search, and copy prompts instantly.**

Built with Electron + React 19 + Vite + shadcn/ui + Tailwind CSS v4 + SQLite3

[![GitHub release](https://img.shields.io/github/v/release/bilals2008/QuickPrompt?style=flat-square&logo=github)](https://github.com/bilals2008/QuickPrompt/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-00b843?style=flat-square&logo=opensourceinitiative&logoColor=white)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-42-47848F?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Windows](https://img.shields.io/badge/Platform-Windows-0078D4?style=flat-square&logo=windows&logoColor=white)](https://www.microsoft.com/windows)
[![macOS](https://img.shields.io/badge/Platform-macOS-000000?style=flat-square&logo=apple&logoColor=white)](https://www.apple.com/macos/)
[![Linux](https://img.shields.io/badge/Platform-Linux-FCC624?style=flat-square&logo=linux&logoColor=black)](https://www.linux.org/)

<br />

![QuickPrompt Workspace](screenshots/workspace.avif)

</div>

---

## Overview

QuickPrompt is a **fast, offline-first prompt manager** designed for developers, writers, and AI users who constantly reuse prompts. Instead of losing prompts across notes, chats, and files, QuickPrompt keeps everything locally stored, properly tagged, and one-click copy ready.

- **Instant access** — floating action button for quick saves
- **One-click copy** — copy any prompt to clipboard instantly
- **Smart tagging** — autocomplete tag system with color-coded labels
- **Full-text search** — search across content and tags simultaneously
- **Encrypted vault** — store passwords, API keys, and secrets safely
- **Folder organization** — organize prompts and vault items into folders
- **Backup & restore** — encrypted export/import for secure data portability
- **Multiple themes** — Light, Cyberpunk, Volt, Noir, and Ember

---

## Features

### Prompt Management

- Quick save via floating action button
- Edit prompts from card menu or double-click to view full content
- Favorite system with filtering
- Grid/List toggle view
- Drag & drop reorder with keyboard support

### Vault (Encrypted)

- Store passwords, API keys, and other secrets
- Secrets encrypted with your computer's built-in security
- Grid and Accordion view toggle with sorting
- Sticky-note style cards with type-based coloring
- Pin important items and mark favorites

### Folders & Collections

- Full folder system for prompts and vault items
- Folder grid view with breadcrumb navigation
- Create, rename, and delete folders
- Bulk selection for moving multiple items
- Custom folder icons with size customization
- Folder appearance picker with custom colors

### Search & Navigation

- Animated search bar with toggle and clear
- Conditional search based on active view
- Spotlight search for quick navigation
- Settings sidebar search

### Backup & Security

- Encrypted backup and restore
- Secure data portability
- Local-only storage (no cloud dependency)

### Themes

| Theme | Description |
|-------|-------------|
| **Light** | Clean minimal UI |
| **Cyberpunk** | Neon-accented dark theme |
| **Volt** | Fresh electric green (default) |
| **Noir** | Dark, moody styling |
| **Ember** | Soft warm amber tint |

### Platform Features

- System tray integration
- Minimal mode (no dock on macOS)
- Native menu bar integration
- Auto-update with download progress and ETA
- Splash screen with smooth loading transition

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop | [Electron 42](https://www.electronjs.org/) |
| UI | [React 19](https://react.dev/), [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Icons | [Tabler Icons](https://tabler.io/icons) |
| Database | [SQLite3](https://www.sqlite.org/) |
| Build | [Vite 8](https://vitejs.dev/) + [vite-plugin-electron](https://github.com/caoxie/vite-plugin-electron) |
| Packaging | [electron-builder 26](https://www.electron.build/) |
| Animations | [@dnd-kit](https://dndkit.com/) (drag & drop) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v24 or later
- npm or yarn

### Install

```bash
# Clone the repository
git clone https://github.com/bilals2008/QuickPrompt.git
cd QuickPrompt

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Build

```bash
# Windows (NSIS installer)
npm run dist:win

# macOS (DMG)
npm run dist:mac

# macOS ARM (Apple Silicon)
npm run dist:mac:arm

# Linux (AppImage + DEB)
npm run dist:linux

# All platforms
npm run dist:all
```

Output is generated in the `release/` directory.

---

## Project Structure

```
QuickPrompt/
├── electron/
│   ├── main.js                 # Electron main process
│   ├── preload.js              # Preload script (IPC bridge)
│   ├── backup.js               # Backup & restore with encryption
│   └── database/
│       ├── db.js               # Database connection
│       ├── schema.js           # Table definitions & migrations
│       ├── prompts.js          # Prompt CRUD operations
│       ├── folders.js          # Folder CRUD operations
│       ├── vault.js            # Vault item CRUD
│       └── vault-folders.js    # Vault folder CRUD
│
├── src/
│   ├── main.jsx                # React entry point
│   ├── App.jsx                 # Root component & routing
│   ├── index.css               # Global styles
│   │
│   ├── pages/
│   │   ├── HomePage.jsx        # Main prompt list
│   │   ├── VaultPage.jsx       # Encrypted vault
│   │   ├── CollectionsPage.jsx # Folder browser
│   │   └── Settings.jsx        # App settings
│   │
│   ├── components/
│   │   ├── add-prompt-dialog.jsx
│   │   ├── edit-prompt-dialog.jsx
│   │   ├── prompt-card.jsx
│   │   ├── prompt-detail-dialog.jsx
│   │   ├── sortable-prompt-card.jsx
│   │   ├── tag-manager.jsx
│   │   ├── theme-provider.jsx
│   │   ├── empty-state.jsx
│   │   ├── section-header.jsx
│   │   ├── vault-item-dialog.jsx
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── folders/            # Folder components
│   │   ├── vault/              # Vault view components
│   │   ├── collections/        # Collection components
│   │   ├── icons/              # Custom icons
│   │   └── settings/           # Settings components
│   │
│   ├── features/
│   │   ├── import-export/      # Import/Export page
│   │   ├── onboarding/         # Onboarding flow
│   │   └── spotlight-search/   # Spotlight search
│   │
│   ├── hooks/
│   │   ├── use-theme.jsx
│   │   ├── useFolders.js
│   │   ├── useVaultFolders.js
│   │   ├── usePromptLoader.js
│   │   ├── useCardDisplaySettings.js
│   │   └── useFolderDisplaySettings.js
│   │
│   └── lib/
│       ├── utils.js
│       ├── prompt-utils.js
│       ├── folder-appearance.js
│       ├── vault-types.js
│       ├── tag-utils.js
│       ├── tag-colors.js
│       └── sticky-tint.js
│
├── public/
├── build/                      # App icons
├── screenshots/
├── vite.config.js
├── components.json             # shadcn/ui config
└── package.json
```

---

## Database

Data is stored locally at:

```
{userData}/QuickPrompt/quickprompt.db
```

### Tables

| Table | Description |
|-------|-------------|
| `prompts` | Prompt content, favorites, metadata |
| `tags` | Tag definitions and associations |
| `folders` | Prompt folder hierarchy |
| `vault_folders` | Vault folder hierarchy |
| `vault_items` | Encrypted vault entries |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with Electron |
| `npm run build` | Build for production |
| `npm run dist:win` | Package for Windows |
| `npm run dist:mac` | Package for macOS |
| `npm run dist:linux` | Package for Linux |
| `npm run dist:all` | Package for all platforms |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please use [Conventional Commits](https://www.conventionalcommits.org/) format.

---

## Author

**Muhammad Bilal Hassan**

[![GitHub](https://img.shields.io/badge/GitHub-bilals2008-181717?style=flat-square&logo=github)](https://github.com/bilals2008)
[![Website](https://img.shields.io/badge/Website-mbilalhassan.vercel.app-00b843?style=flat-square&logo=vercel&logoColor=white)](https://mbilalhassan.vercel.app/)

---

## Related Projects

### [Prompt Nest](https://github.com/bilals2008/prompt-nest)

A more advanced prompt system with collections, analytics, templates & activity logs.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Built with care by [Muhammad Bilal Hassan](https://github.com/bilals2008)**

</div>
