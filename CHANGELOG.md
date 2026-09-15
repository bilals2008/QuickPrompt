# Changelog

All notable changes to QuickPrompt will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.3.0] - September 15, 2026

### Added

#### Animated Search Bar

- Animated search bar toggle with smooth expand/collapse transition
- Clear button to quickly reset search input
- Conditional search rendering based on active view mode
- Improved search bar sizing, spacing, and visual polish

#### Backup & Restore

- Full backup and restore functionality with encryption support
- Encrypted export/import for secure data portability
- Restore data from encrypted backup files

#### Folder Customization Enhancements

- Custom icon upload for folder appearance
- Tooltip support on folder icons and controls
- Folder size customization in appearance settings
- Improved appearance handling across folder components

### Changed

- VaultViewToggle and VaultPage updated for improved UI and functionality
- Search behavior refined to adapt to grid/list view modes

---

## [2.2.0] - September 15, 2026

### Added

#### Splash Screen

- Splash screen with animated loading indicator and smooth transition into the app

#### Update & Download Progress

- Download progress now shows speed, total size, and estimated time remaining (ETA)
- Restart option in settings after an update finishes downloading

#### Vault Views

- Vault view toggle with **Grid** and **Accordion** layout options
- Sorting options for vault items within each view mode

#### Themes & Appearance

- New **Ember** theme with a soft warm amber tint

#### Folder Icons & Appearance

- Folder icon picker for customizing folder appearance
- Appearance property for both regular and vault folder creation
- Updated folder icons component with expanded icon set

### Changed

#### Vault Refactor

- VaultItemCard merged into VaultItemViews for a simpler component structure
- VaultItemViews now uses a maskValue utility for secret masking

---

## [2.1.0] - September 13, 2026

### Added

#### Themes & Appearance

- New **Noir** theme with dark, moody styling
- Default theme changed to **Volt** for a fresher look
- Theme cleanup — kept only Light, Cyberpunk, Volt, and Noir

#### Interaction

- Double-click any prompt card to view its full content in a dialog
- Entrance animation for folder tiles in CollectionsPage and VaultPage

#### Folder Management

- Dialog-based folder creation for a smoother workflow
- Bulk selection mode for moving multiple items into folders at once

#### Onboarding

- Enhanced onboarding steps with new icons and clearer descriptions

#### About

- About section redesigned with improved layout and styling

### Changed

#### Default Theme

- Default theme switched from Light to **Volt**

### Fixed

#### UI Fixes

- Select all button logic simplified in CollectionsPage and VaultPage
- Dropdown menu actions no longer close prematurely

---

## [2.0.0] - September 13, 2026

### Added

#### Folders & Collections

- Full folder system for organizing prompts and vault items
- CollectionsPage with folder grid view and breadcrumb navigation
- Create, rename, and delete folders
- Move prompts and vault items into folders via dropdown or dialog picker
- Folder badges on prompt cards for quick identification

#### Folder Appearance

- Folder Appearance Picker with custom color input
- Hex color validation for folder styling
- Folder display settings on HomePage
- Configure folder icons and display preferences

#### Vault Improvements

- Attachments support added to vault items
- URL field added for link storage
- Card tints for visual customization
- Meta field for extra metadata
- Delete confirmation dialog to prevent accidental deletion

#### Settings & UI

- Window size settings updated with better descriptions
- Enforced width cap in UI for consistent layout

### Changed

#### Codebase Refactor

- Code structure refactored for improved readability and maintainability
- CollectionsPage layout redesigned with section headers
- VaultItemDialog now uses a select component for folder selection

### Fixed

#### UI Fixes

- Folder name truncation in folder details popup fixed
- Back button behavior simplified across folder navigation
- Folder selector now works in both mini and full AddPrompt dialog modes

---

## [1.9.0] - August 14, 2026

### Added

#### Vault

- Store passwords, API keys, and other secret info safely inside QuickPrompt
- Secrets are locked with your computer's built-in security
- Add, edit, and search for credentials quickly
- Pin important items to the top and mark favorites with a star
- Colorful sticky-note style cards — each type has its own color
- Works in the mini window with easy copy-and-paste buttons

#### Drag & Drop Reorder

- Grab any prompt and drag it anywhere to organize your list
- Full keyboard support for reordering
- Tooltips and springy animation for smooth feedback

### Fixed

#### Stability Fixes

- Rearranging prompts with drag & drop now saves correctly every time
- Small text and color fixes inside the Vault windows

---

## [1.8.0] - June 18, 2026

### Added

#### Import & Export Page

- Full-featured page for importing and exporting prompts
- Drag-and-drop file import with JSON, CSV, and Markdown support
- Import preview with valid/invalid counts and skipped-item details
- Export panel with format selection and prompt count summary

#### Settings Navigation

- Settings sidebar search added
- Quickly jump to any settings section
- `/` keyboard shortcut support

#### Theme Cards

- Redesigned appearance picker with larger, selectable theme cards
- Improved theme selection experience

### Changed

#### Settings Experience Overhaul

- Settings page redesigned with cleaner card-based sections
- Improved spacing and visual hierarchy
- Updated iconography across settings
- Better responsive behavior across all screen sizes

#### Section Refresh

- Backup section updated to match the new card-based design
- Updates section redesigned for consistency
- About section refreshed with improved layout and styling

### Fixed

#### Prompt Editor Improvements

- Add/Edit Prompt dialogs no longer expand endlessly when pasting large content
- Textarea height is now capped for better usability
- Large prompts are now scrollable inside the editor
