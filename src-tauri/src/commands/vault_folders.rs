// Vault folder commands (see electron/preload.js `vaultFolderAPI`).
use serde_json::Value;
use tauri::State;

use crate::db::DbState;
use crate::repo::vault_folders as repo;

#[tauri::command]
pub fn vault_folders_create(
    state: State<'_, DbState>,
    data: repo::NewVaultFolder,
) -> Result<Value, String> {
    state.with_conn(|conn| repo::create(conn, data))
}

#[tauri::command]
pub fn vault_folders_list(state: State<'_, DbState>) -> Result<Vec<Value>, String> {
    state.with_conn(repo::get_all)
}

#[tauri::command]
pub fn vault_folders_roots(state: State<'_, DbState>) -> Result<Vec<Value>, String> {
    state.with_conn(repo::roots)
}

#[tauri::command]
pub fn vault_folders_children(
    state: State<'_, DbState>,
    parent_id: String,
) -> Result<Vec<Value>, String> {
    state.with_conn(|conn| repo::children(conn, &parent_id))
}

#[tauri::command]
pub fn vault_folders_breadcrumb(
    state: State<'_, DbState>,
    folder_id: String,
) -> Result<Vec<Value>, String> {
    state.with_conn(|conn| repo::breadcrumb(conn, &folder_id))
}

#[tauri::command]
pub fn vault_folders_rename(
    state: State<'_, DbState>,
    id: String,
    name: String,
) -> Result<Option<Value>, String> {
    state.with_conn(|conn| repo::rename(conn, &id, &name))
}

#[tauri::command]
pub fn vault_folders_update(
    state: State<'_, DbState>,
    id: String,
    data: Option<repo::UpdateVaultFolder>,
) -> Result<Option<Value>, String> {
    let data = data.unwrap_or_default();
    state.with_conn(|conn| repo::update(conn, &id, data))
}

#[tauri::command]
pub fn vault_folders_delete(state: State<'_, DbState>, id: String) -> Result<Value, String> {
    state.with_conn(|conn| repo::delete(conn, &id))
}

#[tauri::command]
pub fn vault_folders_add_item(
    state: State<'_, DbState>,
    vault_item_id: String,
    folder_id: String,
) -> Result<Value, String> {
    state.with_conn(|conn| repo::add_item(conn, &vault_item_id, &folder_id))
}

#[tauri::command]
pub fn vault_folders_remove_item(
    state: State<'_, DbState>,
    vault_item_id: String,
    folder_id: String,
) -> Result<Value, String> {
    state.with_conn(|conn| repo::remove_item(conn, &vault_item_id, &folder_id))
}

#[tauri::command]
pub fn vault_folders_get_items(
    state: State<'_, DbState>,
    folder_id: String,
    options: Option<repo::FolderItemOptions>,
) -> Result<Value, String> {
    let options = options.unwrap_or_default();
    state.with_conn(|conn| repo::get_items(conn, &folder_id, options))
}

#[tauri::command]
pub fn vault_folders_get_item_folders(
    state: State<'_, DbState>,
    vault_item_id: String,
) -> Result<Vec<Value>, String> {
    state.with_conn(|conn| repo::get_item_folders(conn, &vault_item_id))
}

#[tauri::command]
pub fn vault_folders_search(
    state: State<'_, DbState>,
    query: String,
) -> Result<Vec<Value>, String> {
    state.with_conn(|conn| repo::search(conn, &query))
}
