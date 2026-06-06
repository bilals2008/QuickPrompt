import { useEffect, useState, useCallback } from "react"

export const DEFAULT_CARD_DISPLAY = {
  showTags: true,
  showTagInput: true,
  showTitle: true,
  showBody: true,
  showStar: true,
  showCopyButton: true,
  showTimestamp: true,
}

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
