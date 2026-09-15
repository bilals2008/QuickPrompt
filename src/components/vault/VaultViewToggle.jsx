import { IconLayoutGrid, IconListDetails, IconCheck } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

const VIEWS = [
  { id: "grid", label: "Grid", icon: IconLayoutGrid },
  { id: "accordion", label: "Accordion", icon: IconListDetails },
]

export function VaultViewToggle({ value, onChange }) {
  const active = VIEWS.find((v) => v.id === value) ?? VIEWS[0]
  const ActiveIcon = active.icon

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground"
              aria-label={`Change view (${active.label})`}
            >
              <ActiveIcon size={14} />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">View: {active.label}</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-40">
        {VIEWS.map((view) => {
          const Icon = view.icon
          const isActive = view.id === value
          return (
            <DropdownMenuItem
              key={view.id}
              onClick={() => onChange(view.id)}
              className="gap-2"
            >
              <Icon
                size={14}
                className={isActive ? "text-foreground" : "text-muted-foreground"}
              />
              <span>{view.label}</span>
              {isActive && <IconCheck size={14} className="ml-auto text-primary" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const VAULT_VIEW_MODES = VIEWS.map((v) => v.id)
