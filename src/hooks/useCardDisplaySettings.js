import { useEffect, useState, useCallback } from "react"

export const DEFAULT_CARD_DISPLAY = {
  showTags: true,
  showTagInput: true,
  showTitle: true,
  showBody: true,
  showStar: true,
  showCopyButton: true,
  showTimestamp: true,
  cardDensity: "normal",
  maxLines: 3,
  colorByTag: false,
}

export const DENSITY_CLASSES = {
  compact: { card: "p-2", gap: "gap-1", footer: "px-2 py-1.5" },
  normal: { card: "p-3.5", gap: "gap-2", footer: "px-3.5 py-1.5" },
  comfortable: { card: "p-5", gap: "gap-3", footer: "px-5 py-2" },
}

export const LINE_CLAMP_MAP = { "2": "line-clamp-2", "3": "line-clamp-3", "5": "line-clamp-5", "0": "" }

const STORAGE_KEY = "cardDisplay"

export function useCardDisplaySettings() {
  const [settings, setSettings] = useState(DEFAULT_CARD_DISPLAY)

  useEffect(() => {
    let mounted = true
    window.settingsAPI?.get(STORAGE_KEY, DEFAULT_CARD_DISPLAY).then((stored) => {
      if (!mounted) return
      setSettings({ ...DEFAULT_CARD_DISPLAY, ...(stored || {}) })
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
