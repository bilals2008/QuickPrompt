// File: src/components/ui/sonner.jsx
import { useTheme } from "@/hooks/use-theme"
import { Toaster as Sonner } from "sonner";
import { IconCircleCheck, IconInfoCircle, IconAlertTriangle, IconCircleX, IconLoader2 } from "@tabler/icons-react"

const TOASTER_THEMES = { light: "light", dark: "dark", forest: "dark", ocean: "dark", sunset: "dark", midnight: "dark", nord: "light", lavender: "light", dracula: "dark", "tokyo-night": "dark", cyberpunk: "dark" }

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()
  const sonnerTheme = theme === "system" ? "system" : (TOASTER_THEMES[theme] || "dark")

  return (
    <Sonner
      theme={sonnerTheme}
      className="toaster group"
      position="bottom-center"
      duration={2500}
      icons={{
        success: (
          <IconCircleCheck className="size-3.5" />
        ),
        info: (
          <IconInfoCircle className="size-3.5" />
        ),
        warning: (
          <IconAlertTriangle className="size-3.5" />
        ),
        error: (
          <IconCircleX className="size-3.5" />
        ),
        loading: (
          <IconLoader2 className="size-3.5 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)"
        }
      }
      toastOptions={{
        classNames: {
          toast: "desktop-toast",
        },
      }}
      {...props} />
  );
}

export { Toaster }
