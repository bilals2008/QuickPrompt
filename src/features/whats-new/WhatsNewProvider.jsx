import { useCallback, useEffect, useMemo, useState } from "react"
import { getEntriesForInstall } from "@/lib/changelog"
import { WhatsNewContext } from "./whats-new-context"
import { WhatsNewDialog } from "./WhatsNewDialog"

const STORAGE_KEY = "lastSeenVersion"
const AUTO_SHOW_DELAY_MS = 1500

async function readLastSeen() {
  if (window.settingsAPI?.get) return window.settingsAPI.get(STORAGE_KEY, null)
  return localStorage.getItem(STORAGE_KEY)
}

async function writeLastSeen(version) {
  if (window.settingsAPI?.set) return window.settingsAPI.set(STORAGE_KEY, version)
  localStorage.setItem(STORAGE_KEY, version)
  return undefined
}

export function WhatsNewProvider({ currentVersion, children }) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState([])
  const [mode, setMode] = useState("fresh")
  const [lastSeenVersion, setLastSeenVersion] = useState(null)

  useEffect(() => {
    if (!currentVersion) return undefined

    let cancelled = false
    let timer

    readLastSeen().then((stored) => {
      if (cancelled) return
      const result = getEntriesForInstall({ lastSeenVersion: stored, currentVersion })
      if (result.entries.length === 0) return

      setEntries(result.entries)
      setMode(result.mode)
      setLastSeenVersion(stored ?? null)
      timer = setTimeout(() => {
        if (!cancelled) setOpen(true)
      }, AUTO_SHOW_DELAY_MS)
    })

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [currentVersion])

  const dismiss = useCallback(() => {
    setOpen(false)
    if (!currentVersion) return
    writeLastSeen(currentVersion)
  }, [currentVersion])

  const handleOpenChange = useCallback(
    (next) => {
      if (next) setOpen(true)
      else dismiss()
    },
    [dismiss]
  )

  const value = useMemo(
    () => ({ open, entries, mode, lastSeenVersion, dismiss }),
    [open, entries, mode, lastSeenVersion, dismiss]
  )

  return (
    <WhatsNewContext.Provider value={value}>
      {children}
      <WhatsNewDialog
        open={open}
        onOpenChange={handleOpenChange}
        entries={entries}
        mode={mode}
        lastSeenVersion={lastSeenVersion}
      />
    </WhatsNewContext.Provider>
  )
}
