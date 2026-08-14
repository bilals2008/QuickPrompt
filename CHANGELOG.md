# Changelog

All notable changes to this project will be documented in this file.

## [1.9.0] - 2026-08-14

### Added
- **Vault (New!)**: store passwords, API keys, and other secret info safely inside QuickPrompt.
  - Your secrets are locked with your computer's built-in security, so only you can see them.
  - Add, edit, and search for credentials quickly.
  - Pin important items to the top, mark favorites with a star, and organize with colorful tags.
  - Cards match the app's fun sticky-note look — each type has its own color.
  - Use it in the mini window too, with easy copy-and-paste buttons.
- **Drag & drop reorder for prompts**: grab any prompt and drag it anywhere you want to organize your list — works with the keyboard too.
- **Tooltips & springy animation** when reordering, so it feels smooth and clear.

### Fixed
- Rearranging prompts with drag & drop now saves correctly every time.
- Small text and color fixes inside the Vault windows so everything is easy to read.

## [1.8.0] - 2026-06-18

### Added
- **Import & Export page**: full-featured page for importing and exporting prompts.
  - Drag-and-drop file import with JSON, CSV, and Markdown support.
  - Import preview with valid/invalid counts and skipped-item details.
  - Export panel with format selection and prompt count summary.
- **Settings sidebar search**: quickly jump to a settings section with `/` shortcut.
- **Theme cards**: redesigned appearance picker with larger, selectable theme cards.

### Changed
- **Settings layout overhaul**: sections are now grouped into cleaner cards with improved spacing, iconography, and responsive behavior.
- Backup, updates, and about sections updated to match the new card-based layout.

### Fixed
- Add/Edit prompt dialogs no longer expand endlessly when pasting large prompts; textarea height is now capped with scroll.
