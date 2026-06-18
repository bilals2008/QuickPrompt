# Changelog

All notable changes to this project will be documented in this file.

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
