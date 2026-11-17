import { useState } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { IconCopy, IconCheck } from "@tabler/icons-react"
import { toast } from "sonner"
import { getPromptTitle } from "@/lib/prompt-utils"
import { parseTagsString } from "@/lib/tag-utils"
import { TAG_CLASS, getTagColor } from "@/lib/tag-colors"
import { cn } from "@/lib/utils"

const markdownPlugins = [remarkGfm]

const markdownComponents = {
  a: ({ href, children }) => {
    if (!href) return <span>{children}</span>
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={async (event) => {
          if (!window.shellAPI?.openExternal) return
          event.preventDefault()
          try {
            const result = await window.shellAPI.openExternal(href)
            if (!result?.success) toast.error("Could not open link")
          } catch {
            toast.error("Could not open link")
          }
        }}
      >
        {children}
      </a>
    )
  },
  img: ({ alt }) => <span className="text-muted-foreground">[Image: {alt || "not loaded"}]</span>,
  table: ({ children }) => (
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Markdown table">
      <table>{children}</table>
    </div>
  ),
}

function markdownUrlTransform(url) {
  return /^https?:\/\//i.test(url) ? url : ""
}

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
  const [preview, setPreview] = useState(true)

  if (!prompt) return null

  const title = getPromptTitle(prompt)
  const content = typeof prompt.content === "string" ? prompt.content : ""
  const hasTags = parseTagsString(prompt.tags).length > 0

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Could not copy prompt")
    }
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

          <div className="flex items-center gap-3 px-5 pb-2 text-xs text-muted-foreground" role="group" aria-label="Prompt display">
            <span
              className={cn("cursor-pointer select-none transition-colors", preview ? "text-foreground font-medium" : "hover:text-foreground/70")}
              onClick={() => setPreview(true)}
              aria-pressed={preview}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setPreview(true)}
            >
              Preview
            </span>
            <span className="text-border">/</span>
            <span
              className={cn("cursor-pointer select-none transition-colors", !preview ? "text-foreground font-medium" : "hover:text-foreground/70")}
              onClick={() => setPreview(false)}
              aria-pressed={!preview}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setPreview(false)}
            >
              Source
            </span>
          </div>

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-5 pb-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" tabIndex={0} role="region" aria-label={preview ? "Markdown preview" : "Prompt source"}>
            {preview ? (
              <div className="prompt-markdown">
                <Markdown remarkPlugins={markdownPlugins} components={markdownComponents} urlTransform={markdownUrlTransform}>
                  {content}
                </Markdown>
              </div>
            ) : (
              <div className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-muted-foreground">
                {content}
              </div>
            )}
          </div>

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
