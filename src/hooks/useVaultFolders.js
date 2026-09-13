import { useCallback, useEffect, useMemo, useState } from "react"

/**
 * Loads and mutates the vault folders tree. Mirrors useFolders so prompt and
 * vault folders behave the same way.
 */
export function useVaultFolders() {
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const all = await window.vaultFolderAPI?.list()
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
    async ({ name, parentId = null, icon, color }) => {
      const created = await window.vaultFolderAPI.create({ name, parentId, icon, color })
      await reload()
      return created
    },
    [reload]
  )

  const updateFolder = useCallback(
    async (id, patch) => {
      const updated = await window.vaultFolderAPI.update(id, patch)
      await reload()
      return updated
    },
    [reload]
  )

  const deleteFolder = useCallback(
    async (id) => {
      await window.vaultFolderAPI.delete(id)
      await reload()
    },
    [reload]
  )

  const itemsInFolder = useCallback(async (folderId) => {
    const result = await window.vaultFolderAPI.getItems(folderId)
    return result?.items || []
  }, [])

  const breadcrumbFor = useCallback(
    (folderId) => {
      const chain = []
      let current = byId[folderId]
      while (current) {
        chain.unshift(current)
        current = current.parent_id ? byId[current.parent_id] : null
      }
      return chain
    },
    [byId]
  )

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
    itemsInFolder,
    breadcrumbFor,
  }
}

export default useVaultFolders
