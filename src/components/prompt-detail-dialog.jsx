import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { IconCopy, IconCheck } from "@tabler/icons-react"
import { getPromptTitle, getPromptBody } from "@/lib/prompt-utils"
import { parseTagsString } from "@/lib/tag-utils"
import { TAG_CLASS, getTagColor } from "@/lib/tag-colors"
import { cn } from "@/lib/utils"

function TagChips({ tags }) {
  const list = parseTagsString(tags)
  if (list.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {list.map((tag) => (
        <span key={tag} className={cn(TAG_CLASS, getTagColor(tag))}>
          {tag}
        </span>
      ))}
    </div>
  )
}

function formatDateTime(date) {
  if (!date) return ""
  return new Date(date).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function PromptDetailDialog({ prompt, open, onOpenChange }) {
  const [copied, setCopied] = useState(false)

  if (!prompt) return null

  const title = getPromptTitle(prompt)
  const content = typeof prompt.content === "string" ? prompt.content : ""
  const hasTags = parseTagsString(prompt.tags).length > 0

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <div className="flex flex-col max-h-[80vh]">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="pr-8">{title}</DialogTitle>
            {prompt.created_at && (
              <DialogDescription>{formatDateTime(prompt.created_at)}</DialogDescription>
            )}
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 px-5">
            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground pb-5">
              {content}
            </div>
          </ScrollArea>

          {hasTags && (
            <div className="px-5 pt-2 pb-1">
              <TagChips tags={prompt.tags} />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t bg-muted/50 px-5 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5"
            >
              {copied ? (
                <>
                  <IconCheck className="size-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <IconCopy className="size-3.5" />
                  Copy prompt
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PromptDetailDialog
