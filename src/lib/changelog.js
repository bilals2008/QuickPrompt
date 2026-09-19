import {
  IconArchive,
  IconBug,
  IconCopy,
  IconDeviceDesktop,
  IconDownload,
  IconFolderCog,
  IconFolderOpen,
  IconHistory,
  IconLayoutGrid,
  IconPalette,
  IconPin,
  IconSearch,
  IconSparkles,
  IconSun,
} from "@tabler/icons-react"

export const GITHUB_RELEASES_URL = "https://github.com/bilals2008/QuickPrompt/releases"

export const SECTION_META = {
  added: { label: "New", dot: "bg-emerald-500" },
  improved: { label: "Improved", dot: "bg-sky-500" },
  fixed: { label: "Fixed", dot: "bg-amber-500" },
  removed: { label: "Removed", dot: "bg-rose-500" },
}

export const CHANGELOG = [
  {
    version: "2.4.0",
    date: "2026-09-19",
    title: "What's New dialog and silent updates",
    sections: [
      {
        type: "added",
        items: [
          { icon: IconSparkles, title: "What's New", desc: "Release highlights after every update" },
          { icon: IconHistory, title: "Skipped releases", desc: "Catch up on versions you missed" },
        ],
      },
      {
        type: "improved",
        items: [
          { icon: IconDownload, title: "Silent Windows updates", desc: "No setup wizard on every update" },
        ],
      },
      {
        type: "fixed",
        items: [
          { icon: IconBug, title: "Dialog backdrop", desc: "Overlays now dim the background correctly" },
        ],
      },
    ],
  },
  {
    version: "2.3.0",
    date: "2026-09-15",
    title: "Backup, restore and folder polish",
    sections: [
      {
        type: "added",
        items: [
          { icon: IconArchive, title: "Backup & Restore", desc: "Export and import everything with encryption" },
          { icon: IconFolderCog, title: "Custom folder icons", desc: "Upload your own icon for any folder" },
          { icon: IconSearch, title: "Animated search bar", desc: "Smooth expand and collapse with a clear button" },
        ],
      },
      {
        type: "improved",
        items: [
          { icon: IconPalette, title: "Folder appearance", desc: "Control folder size and tooltips" },
        ],
      },
    ],
  },
  {
    version: "2.2.0",
    date: "2026-09-15",
    title: "Splash screen and vault views",
    sections: [
      {
        type: "added",
        items: [
          { icon: IconSparkles, title: "Splash screen", desc: "Animated loading indicator on startup" },
          { icon: IconLayoutGrid, title: "Vault grid & accordion views", desc: "Switch layouts and sort items your way" },
          { icon: IconSun, title: "Ember theme", desc: "A soft warm amber tint" },
        ],
      },
      {
        type: "improved",
        items: [
          { icon: IconDeviceDesktop, title: "Update download progress", desc: "Speed, size and time remaining" },
        ],
      },
    ],
  },
  {
    version: "2.1.0",
    date: "2026-09-13",
    title: "New themes and a faster workflow",
    sections: [
      {
        type: "added",
        items: [
          { icon: IconSun, title: "Noir theme", desc: "Dark and moody styling" },
          { icon: IconCopy, title: "Double-click to preview", desc: "Read any prompt in a dialog" },
          { icon: IconFolderOpen, title: "Bulk move to folders", desc: "Select many items and move them at once" },
        ],
      },
      {
        type: "improved",
        items: [
          { icon: IconPalette, title: "Volt is now the default theme", desc: "A fresher look out of the box" },
        ],
      },
      {
        type: "fixed",
        items: [
          { icon: IconBug, title: "Dropdown menus", desc: "No longer close prematurely" },
        ],
      },
    ],
  },
  {
    version: "2.0.0",
    date: "2026-09-13",
    title: "Folders and collections",
    sections: [
      {
        type: "added",
        items: [
          { icon: IconFolderOpen, title: "Full folder system", desc: "Organize prompts and vault items" },
          { icon: IconPalette, title: "Folder colors", desc: "Style folders with your own color" },
          { icon: IconPin, title: "Vault attachments & URLs", desc: "Attach files and save links" },
        ],
      },
      {
        type: "fixed",
        items: [
          { icon: IconBug, title: "Folder name truncation", desc: "Long names no longer overflow" },
        ],
      },
    ],
  },
]

export function parseVersion(version) {
  return String(version ?? "")
    .split("-")[0]
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0)
}

export function compareVersions(a, b) {
  const left = parseVersion(a)
  const right = parseVersion(b)
  for (let i = 0; i < 3; i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0)
    if (diff !== 0) return diff > 0 ? 1 : -1
  }
  return 0
}

export function getShippedEntries(currentVersion) {
  if (!currentVersion) return []
  return CHANGELOG.filter((entry) => compareVersions(entry.version, currentVersion) <= 0)
}

export function getEntriesForInstall({ lastSeenVersion, currentVersion }) {
  const shipped = getShippedEntries(currentVersion)
  if (shipped.length === 0) return { mode: "fresh", entries: [] }
  if (!lastSeenVersion) return { mode: "fresh", entries: shipped.slice(0, 1) }

  const missed = shipped.filter((entry) => compareVersions(entry.version, lastSeenVersion) > 0)
  if (missed.length === 0) return { mode: "update", entries: [] }
  return { mode: "update", entries: missed }
}
