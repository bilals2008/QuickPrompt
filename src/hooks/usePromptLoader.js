import { useCallback, useEffect, useRef, useState } from "react"
import { parseTagsString } from "@/lib/tag-utils"

const DEFAULT_PAGE_SIZE = 100

function normalizePrompt(p) {
  if (!p) return p
  return {
    ...p,
    title: typeof p.title === "string" ? p.title : "",
    tags: parseTagsString(p.tags),
  }
}

export function usePromptLoader({ search = "", favoritesOnly = false, pageSize = DEFAULT_PAGE_SIZE, caseSensitive = false, tagsOnly = false, sortOrder = "newest" } = {}) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState(null)

  const requestIdRef = useRef(0)
  const loadingRef = useRef(false)
  const doneRef = useRef(false)
  const filterKey = `${search} ${favoritesOnly} ${pageSize} ${caseSensitive} ${tagsOnly} ${sortOrder}`

  const fetchPage = useCallback(
    async (offset, { append }) => {
      const myRequest = ++requestIdRef.current
      loadingRef.current = true
      setLoading(true)
      setError(null)
      try {
        const result = await window.db.getPromptsPaginated({
          limit: pageSize,
          offset,
          search,
          favoritesOnly,
          caseSensitive,
          tagsOnly,
          sortOrder,
        })

        if (myRequest !== requestIdRef.current) return

        const batch = (result?.prompts ?? []).map(normalizePrompt)
        const totalCount = result?.total ?? 0

        setTotal(totalCount)

        if (append) {
          setItems((prev) => {
            const known = new Set(prev.map((p) => p.id))
            const fresh = batch.filter((p) => !known.has(p.id))
            return fresh.length > 0 ? [...prev, ...fresh] : prev
          })
        } else {
          setItems(batch)
        }

        if (offset + batch.length >= totalCount) {
          doneRef.current = true
        } else {
          doneRef.current = false
        }
      } catch (err) {
        if (myRequest === requestIdRef.current) {
          console.error("usePromptLoader: failed to load prompts", err)
          setError(err)
        }
      } finally {
        if (myRequest === requestIdRef.current) {
          loadingRef.current = false
          setLoading(false)
          setInitialLoading(false)
        }
      }
    },
    [search, favoritesOnly, pageSize, caseSensitive, tagsOnly, sortOrder]
  )

  useEffect(() => {
    doneRef.current = false
    setItems([])
    setTotal(0)
    setInitialLoading(true)
    fetchPage(0, { append: false })
  }, [filterKey, fetchPage])

  const loadMore = useCallback(() => {
    if (loadingRef.current || doneRef.current) return
    fetchPage(items.length, { append: true })
  }, [items.length, fetchPage])

  const refresh = useCallback(() => {
    doneRef.current = false
    fetchPage(0, { append: false })
  }, [fetchPage])

  return {
    items,
    total,
    loading,
    initialLoading,
    error,
    done: doneRef.current || items.length >= total,
    hasMore: items.length < total,
    loadMore,
    refresh,
  }
}

export default usePromptLoader
