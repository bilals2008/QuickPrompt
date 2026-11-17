// Resolves a folder path taken from an import file ("Work" or "Parent/Child").
// Existing folders are reused, missing ones are created.

function findChild(folders, parentId, name) {
  const target = name.trim().toLowerCase()
  return folders.find(
    (folder) => (folder.parent_id ?? null) === parentId && String(folder.name).trim().toLowerCase() === target,
  )
}

export async function resolveFolderPath(path, api) {
  const segments = String(path ?? "")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)

  if (segments.length === 0 || !api?.list || !api?.create) {
    return { id: null, created: [] }
  }

  let folders = await api.list()
  if (!Array.isArray(folders)) folders = []

  let parentId = null
  const created = []
  for (const segment of segments) {
    let folder = findChild(folders, parentId, segment)
    if (!folder) {
      folder = await api.create({ name: segment, parentId })
      if (!folder?.id) continue
      folders = [...folders, folder]
      created.push(segment)
    }
    parentId = folder.id
  }

  return { id: parentId, created }
}
