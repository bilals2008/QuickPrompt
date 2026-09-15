# 🚀 QuickPrompt v2.2.0

**Release Date:** September 15, 2026 ✨
🏷️ Version: v2.2.0

---

## ✨ Added

### 🎬 Splash Screen

* Splash screen with animated loading indicator and smooth transition into the app

### ⬇️ Update & Download Progress

* Download progress now shows speed, total size, and estimated time remaining (ETA)
* Restart option in settings after an update finishes downloading

### 🔐 Vault Views

* Vault view toggle with **Grid** and **Accordion** layout options
* Sorting options for vault items within each view mode

### 🎨 Themes & Appearance

* New **Ember** theme with a soft warm amber tint

### 📂 Folder Icons & Appearance

* Folder icon picker for customizing folder appearance
* Appearance property for both regular and vault folder creation
* Updated folder icons component with expanded icon set

---

## 🔄 Changed

### ⚡ Vault Refactor

* VaultItemCard merged into VaultItemViews for a simpler component structure
* VaultItemViews now uses a maskValue utility for secret masking

---

## 🙏 Thank You

A feature-packed update — splash screen, vault view toggle with sorting, a warm Ember theme, folder icon customization, and smarter update downloads with ETA. QuickPrompt keeps getting better! ✨

---

# 🚀 QuickPrompt v2.1.0

**Release Date:** September 13, 2026 ✨
🏷️ Version: v2.1.0

---

## ✨ Added

### 🎨 Themes & Appearance

* New **Noir** theme with dark, moody styling
* Default theme changed to **Volt** for a fresher look
* Theme cleanup — kept only Light, Cyberpunk, Volt, and Noir

### 🖱️ Interaction

* Double-click any prompt card to view its full content in a dialog
* Entrance animation for folder tiles in CollectionsPage and VaultPage

### 📂 Folder Management

* Dialog-based folder creation for a smoother workflow
* Bulk selection mode for moving multiple items into folders at once

### 🚀 Onboarding

* Enhanced onboarding steps with new icons and clearer descriptions

### 🏠 About

* About section redesigned with improved layout and styling

---

## 🔄 Changed

### ⚡ Default Theme

* Default theme switched from Light to **Volt**

---

## 🐛 Fixed

### 📝 UI Fixes

* Select all button logic simplified in CollectionsPage and VaultPage
* Dropdown menu actions no longer close prematurely

---

## 🙏 Thank You

A polish release — new Noir theme, smoother folder management, better onboarding, and a handful of UX fixes. QuickPrompt keeps getting better thanks to your feedback! ✨

---

---

# 🚀 QuickPrompt v2.0.0

**Release Date:** September 13, 2026 ✨
🏷️ Version: v2.0.0

---

## ✨ Added

### 📂 Folders & Collections

* Full folder system for organizing prompts and vault items
* CollectionsPage with folder grid view and breadcrumb navigation
* Create, rename, and delete folders
* Move prompts and vault items into folders via dropdown or dialog picker
* Folder badges on prompt cards for quick identification

### 🎨 Folder Appearance

* Folder Appearance Picker with custom color input
* Hex color validation for folder styling
* Folder display settings on HomePage
* Configure folder icons and display preferences

### 🔐 Vault Improvements

* Attachments support added to vault items
* URL field added for link storage
* Card tints for visual customization
* Meta field for extra metadata
* Delete confirmation dialog to prevent accidental deletion

### ⚙️ Settings & UI

* Window size settings updated with better descriptions
* Enforced width cap in UI for consistent layout

---

## 🔄 Changed

### 🏗️ Codebase Refactor

* Code structure refactored for improved readability and maintainability
* CollectionsPage layout redesigned with section headers
* VaultItemDialog now uses a select component for folder selection

---

## 🐛 Fixed

### 📝 UI Fixes

* Folder name truncation in folder details popup fixed
* Back button behavior simplified across folder navigation
* Folder selector now works in both mini and full AddPrompt dialog modes

---

## 🙏 Thank You

This is a major release bringing the most requested feature — Folders & Collections. Organize your prompts and vault items the way you want, with a beautiful grid view and full control over appearance. Along with vault improvements and under-the-hood refactoring, QuickPrompt is now more powerful and polished than ever. ✨

---
---

# 🚀 QuickPrompt v1.9.0

**Release Date:** August 14, 2026 ✨
🏷️ Version: v1.9.0

---

## ✨ Added

### 🔐 Vault (New!)

* Store passwords, API keys, and other secret info safely inside QuickPrompt
* Secrets are locked with your computer's built-in security
* Add, edit, and search for credentials quickly
* Pin important items to the top and mark favorites with a star
* Colorful sticky-note style cards — each type has its own color
* Works in the mini window with easy copy-and-paste buttons

### 🔀 Drag & Drop Reorder

* Grab any prompt and drag it anywhere to organize your list
* Full keyboard support for reordering
* Tooltips and springy animation for smooth feedback

---

## 🐛 Fixed

### 📝 Stability Fixes

* Rearranging prompts with drag & drop now saves correctly every time
* Small text and color fixes inside the Vault windows

---

## 🙏 Thank You

QuickPrompt now keeps your secrets safe with the new encrypted Vault, and organizing prompts is easier than ever with drag & drop. Enjoy the smoother experience! ✨

---
---

# 🚀 QuickPrompt v1.8.0

**Release Date:** June 18, 2026 ✨
🏷️ Version: v1.8.0

---

## ✨ Added

### 📥 Import & Export Page

* Full-featured page for importing and exporting prompts
* Drag-and-drop file import with JSON, CSV, and Markdown support
* Import preview with valid/invalid counts and skipped-item details
* Export panel with format selection and prompt count summary

### 🔎 Settings Navigation

* Settings sidebar search added
* Quickly jump to any settings section
* `/` keyboard shortcut support

### 🎨 Theme Cards

* Redesigned appearance picker with larger, selectable theme cards
* Improved theme selection experience

---

## 🔄 Changed

### ⚙️ Settings Experience Overhaul

* Settings page redesigned with cleaner card-based sections
* Improved spacing and visual hierarchy
* Updated iconography across settings
* Better responsive behavior across all screen sizes

### 🗂️ Section Refresh

* Backup section updated to match the new card-based design
* Updates section redesigned for consistency
* About section refreshed with improved layout and styling

---

## 🐛 Fixed

### 📝 Prompt Editor Improvements

* Add/Edit Prompt dialogs no longer expand endlessly when pasting large content
* Textarea height is now capped for better usability
* Large prompts are now scrollable inside the editor

---

## 🙏 Thank You

This release focuses on better organization, faster settings navigation, improved data management, and a more polished user experience throughout the application. ✨
