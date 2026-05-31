# 🚀 QuickPrompt

A **desktop sticky-notes-style prompt manager** — create, tag, search, and copy prompts instantly.

Built with **Electron + React 19 + Vite 8 + shadcn/ui + Tailwind CSS v4 + SQLite3**

---

## 🏷️ Badges

![Electron](https://img.shields.io/badge/Electron-42-47848F?logo=electron)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ What is QuickPrompt?

QuickPrompt is a **fast, offline-first prompt manager** designed for developers, writers, and AI users who constantly reuse prompts.

Instead of losing prompts in notes or chat history, QuickPrompt keeps everything:

* ⚡ instantly accessible
* 🏷️ properly tagged
* 📋 one-click copy ready
* 💾 stored locally (SQLite)

---

## ✨ Features

* ⚡ Quick save via floating action button
* 📋 One-click copy to clipboard
* ✏️ Edit prompts from card menu
* ⭐ Favorite system with filtering
* 🏷️ Smart tag system with autocomplete
* 🔍 Full-text search (content + tags)
* 🔄 Grid/List toggle view
* 📱 Responsive sidebar (collapsed/expanded)
* 🎨 Multiple themes (Light, Dark, Forest, Ocean)
* 🧳 System tray + minimal mode (no dock on macOS)
* 💡 Tooltips everywhere (clean UX)
* 🧭 Native menu bar integration
* ⌨️ Fully keyboard-friendly navigation

---

## 🖼️ Screenshots

> Add your app screenshots here

```
/screenshots/home.png
/screenshots/add-prompt.png
/screenshots/themes.png
/screenshots/tray-mode.png
```

---

## 🧰 Tech Stack

| Layer        | Tech                                 |
| ------------ | ------------------------------------ |
| 🖥️ Desktop  | Electron 42                          |
| ⚛️ UI        | React 19, shadcn/ui, Tailwind CSS v4 |
| 🎯 Icons     | @tabler/icons-react                  |
| 🗄️ Database | SQLite3                              |
| ⚡ Build      | Vite 8 + vite-plugin-electron        |
| 📦 Packaging | electron-builder 26                  |

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```

---

## 📦 Build

```bash
# Windows
npm run dist:win

# macOS
npm run dist:mac

# All platforms
npm run dist:all
```

Output: `release/`

---

## 📁 Project Structure

```
electron/
  main.js
  preload.js

  database/
    db.js
    schema.js
    prompts.js

src/
  main.jsx
  App.jsx

  pages/
    HomePage.jsx
    Settings.jsx

  components/
    add-prompt-dialog.jsx
    edit-prompt-dialog.jsx
    prompt-card.jsx
    tag-manager.jsx
    theme-provider.jsx
    ui/

  index.css
  App.css

vite.config.js
```

---

## 🗄️ Database

Stored locally:

```
{userData}/QuickPrompt/quickprompt.db
```

Tables:

* 📝 prompts
* 🏷️ tags

---

## 🎨 Themes

* ☀️ Light — clean minimal UI
* 🌙 Dark — focused dark mode
* 🌲 Forest — natural green tones
* 🌊 Ocean — calm blue tones

---

## 🧠 Why QuickPrompt?

Modern developers use AI tools daily, but prompts get lost across chats, notes, and files.

QuickPrompt solves this by acting as a **local prompt vault**:

* no cloud dependency
* instant access
* structured organization
* zero friction workflow

---

## 🔥 Also Check Out

### Prompt Nest

A more advanced prompt system with collections, analytics, templates & activity logs.

👉 [Prompt Nest GitHub](https://github.com/bilals2008/prompt-nest?utm_source=chatgpt.com)
