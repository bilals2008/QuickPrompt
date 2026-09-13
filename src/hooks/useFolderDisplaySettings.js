import { useCallback, useEffect, useState } from "react"
import { DEFAULT_FOLDER_APPEARANCE } from "@/lib/folder-appearance"

export const DEFAULT_FOLDER_DISPLAY = {
  ...DEFAULT_FOLDER_APPEARANCE,
  showFolderAppearance: true,
  showItemCounts: true,
  confirmDelete: true,
}

const STORAGE_KEY = "folderDisplay"

/**
 * Folder-related preferences: defaults for newly created folders and the
 * display/behavior toggles used by the Collections page.
 */
export function useFolderDisplaySettings() {
  const [settings, setSettings] = useState(DEFAULT_FOLDER_DISPLAY)

  useEffect(() => {
    let mounted = true
    window.settingsAPI?.get(STORAGE_KEY, DEFAULT_FOLDER_DISPLAY).then((stored) => {
      if (!mounted) return
      setSettings({ ...DEFAULT_FOLDER_DISPLAY, ...(stored || {}) })
    })
    return () => {
      mounted = false
    }
  }, [])

  const update = useCallback(async (patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      window.settingsAPI?.set(STORAGE_KEY, next)
      return next
    })
  }, [])

  return [settings, update]
}

export default useFolderDisplaySettings
