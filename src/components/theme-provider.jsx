import { createContext, useContext, useEffect, useState } from "react"

export const ThemeContext = createContext(undefined)

export const THEMES = ["light", "ayu-light", "bloom", "cyberpunk", "volt", "ayu-dark", "hive"]

export function ThemeProvider({ children, defaultTheme = "volt" }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("qp-theme")
    return THEMES.includes(stored) ? stored : defaultTheme
  })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute("data-theme", theme)
    localStorage.setItem("qp-theme", theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used within ThemeProvider")
  return context
}
