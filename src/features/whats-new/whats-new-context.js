import { createContext, useContext } from "react"

export const WhatsNewContext = createContext(null)

export function useWhatsNew() {
  const context = useContext(WhatsNewContext)
  if (!context) throw new Error("useWhatsNew must be used inside WhatsNewProvider")
  return context
}
