import { useTheme } from "@/components/theme-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const THEMES = [
  { id: "light", label: "Light", description: "Clean and bright" },
  { id: "dark", label: "Dark", description: "Easy on the eyes" },
  { id: "forest", label: "Forest", description: "Natural green tones" },
  { id: "ocean", label: "Ocean", description: "Deep blue vibes" },
]

export default function Settings() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Customize your experience</p>
      </div>

      <div className="flex-1 p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>Choose your preferred theme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {THEMES.map((t) => (
                <Button
                  key={t.id}
                  variant="outline"
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "flex-col items-center gap-2 py-4 h-auto cursor-pointer",
                    theme === t.id && "ring-2 ring-ring border-primary"
                  )}
                >
                  <div
                    className={cn(
                      "w-full h-12 rounded-md border border-border",
                      t.id === "light" && "bg-white",
                      t.id === "dark" && "bg-neutral-900",
                      t.id === "forest" && "bg-green-950",
                      t.id === "ocean" && "bg-blue-950"
                    )}
                  />
                  <div className="text-center">
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
