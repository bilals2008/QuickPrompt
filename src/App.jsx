import { Outlet, Link, useLocation } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { IconSettings, IconMessage } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

function App() {
  const location = useLocation()
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <nav className="flex flex-col items-center gap-3 py-4 px-2 border-r border-border bg-sidebar w-14">
        <Link
          to="/"
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-lg transition-colors cursor-pointer",
            location.pathname === "/"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <IconMessage size={18} />
        </Link>
        <div className="flex-1" />
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
      </nav>
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}
export default App
