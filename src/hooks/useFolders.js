import { useCallback, useEffect, useMemo, useState } from "react"

/**
 * Loads and mutates the prompt folders tree. Keeps the Collections page free
 * of data fetching details.
 */
export function useFolders() {
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const all = await window.folderAPI?.list()
      setFolders(all || [])
      return all || []
    } catch {
      setFolders([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const byId = useMemo(() => {
    const map = {}
    for (const f of folders) map[f.id] = f
    return map
  }, [folders])

  const roots = useMemo(() => folders.filter((f) => !f.parent_id), [folders])

  const childrenOf = useCallback(
    (parentId) => folders.filter((f) => f.parent_id === parentId),
    [folders]
  )

  const createFolder = useCallback(
    async ({ name, parentId = null, icon, color, appearance }) => {
      const created = await window.folderAPI.create({ name, parentId, icon, color, appearance })
      await reload()
      return created
    },
    [reload]
  )

  const updateFolder = useCallback(
    async (id, patch) => {
      const updated = await window.folderAPI.update(id, patch)
      await reload()
      return updated
    },
    [reload]
  )

  const deleteFolder = useCallback(
    async (id) => {
      await window.folderAPI.delete(id)
      await reload()
    },
    [reload]
  )

  const promptsInFolder = useCallback(async (folderId) => {
    const result = await window.folderAPI.getPrompts(folderId)
    return result?.prompts || []
  }, [])

  const breadcrumbFor = useCallback((folderId) => {
    const chain = []
    let current = byId[folderId]
    while (current) {
      chain.unshift(current)
      current = current.parent_id ? byId[current.parent_id] : null
    }
    return chain
  }, [byId])

  return {
    folders,
    roots,
    byId,
    loading,
    reload,
    childrenOf,
    createFolder,
    updateFolder,
    deleteFolder,
    promptsInFolder,
    breadcrumbFor,
  }
}

export default useFolders
