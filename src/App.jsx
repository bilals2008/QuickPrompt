import { useState, useEffect, useRef } from "react"
import { Outlet, Link, useLocation } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { IconSettings, IconHome2 } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

function App() {
  const location = useLocation()
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const containerRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setSidebarVisible(entry.contentRect.width > 480)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <TooltipProvider delayDuration={300}>
      <div ref={containerRef} className="flex h-screen w-full bg-background overflow-hidden">
        {sidebarVisible && (
          <nav className="flex flex-col items-center gap-3 py-4 px-2 border-r border-border/30 bg-sidebar w-14 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/"
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-lg transition-colors cursor-pointer",
                    location.pathname === "/"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <IconHome2 size={18} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>Home</TooltipContent>
            </Tooltip>
            <div className="flex-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/settings"
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-lg transition-colors cursor-pointer",
                    location.pathname === "/settings"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <IconSettings size={18} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>Settings</TooltipContent>
            </Tooltip>
          </nav>
        )}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Outlet context={{ sidebarVisible }} />
        </main>
        <Toaster />
      </div>
    </TooltipProvider>
  )
}
export default App
