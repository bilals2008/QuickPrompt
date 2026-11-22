// Prompt folder commands (see electron/preload.js `folderAPI`).
use serde_json::Value;
use tauri::{AppHandle, State};

use crate::db::DbState;
use crate::icons;
use crate::repo::folders as repo;

/// Uploaded icons arrive as data URLs; store the file and keep its short URL.
/// On failure the original value is kept, matching Electron's `resolveIconValue`.
fn resolve_icon(app: &AppHandle, icon: &str) -> String {
    if !icon.starts_with("data:image/") {
        return icon.to_string();
    }
    match icons::save(app, icon) {
        Ok(url) => url,
        Err(err) => {
            eprintln!("[Icons] Failed to store custom icon: {err}");
            icon.to_string()
        }
    }
}

#[tauri::command]
pub async fn folders_create(
    app: AppHandle,
    state: State<'_, DbState>,
    mut data: repo::NewFolder,
) -> Result<Value, String> {
    data.icon = resolve_icon(&app, &data.icon);
    state.with_conn(|conn| repo::create(conn, data))
}

#[tauri::command]
pub fn folders_list(state: State<'_, DbState>) -> Result<Vec<Value>, String> {
    state.with_conn(repo::get_all)
}

#[tauri::command]
pub fn folders_roots(state: State<'_, DbState>) -> Result<Vec<Value>, String> {
    state.with_conn(repo::roots)
}

#[tauri::command]
pub fn folders_children(
    state: State<'_, DbState>,
    parent_id: String,
) -> Result<Vec<Value>, String> {
    state.with_conn(|conn| repo::children(conn, &parent_id))
}

#[tauri::command]
pub fn folders_get(state: State<'_, DbState>, id: String) -> Result<Option<Value>, String> {
    state.with_conn(|conn| repo::find(conn, &id))
}

#[tauri::command]
pub fn folders_breadcrumb(
    state: State<'_, DbState>,
    folder_id: String,
) -> Result<Vec<Value>, String> {
    state.with_conn(|conn| repo::breadcrumb(conn, &folder_id))
}

#[tauri::command]
pub fn folders_rename(
    state: State<'_, DbState>,
    id: String,
    name: String,
) -> Result<Option<Value>, String> {
    state.with_conn(|conn| repo::rename(conn, &id, &name))
}

#[tauri::command]
pub async fn folders_update(
    app: AppHandle,
    state: State<'_, DbState>,
    id: String,
    data: Option<repo::UpdateFolder>,
) -> Result<Option<Value>, String> {
    let mut data = data.unwrap_or_default();
    let previous = state.with_conn(|conn| repo::stored_icon(conn, &id))?;

    if let Some(icon) = data.icon.as_deref() {
        data.icon = Some(resolve_icon(&app, icon));
    }
    let updated = state.with_conn(|conn| repo::update(conn, &id, data))?;

    // The folder no longer points at its old image, so the file can go.
    if let Some(previous) = previous {
        let stored = state
            .with_conn(|conn| repo::stored_icon(conn, &id))?
            .unwrap_or_default();
        if previous != stored {
            icons::delete(&app, &previous);
        }
    }
    Ok(updated)
}

#[tauri::command]
pub async fn folders_delete(
    app: AppHandle,
    state: State<'_, DbState>,
    id: String,
) -> Result<Value, String> {
    let icon = state.with_conn(|conn| repo::stored_icon(conn, &id))?;
    let result = state.with_conn(|conn| repo::delete(conn, &id))?;
    if let Some(icon) = icon {
        icons::delete(&app, &icon);
    }
    Ok(result)
}

#[tauri::command]
pub fn folders_search(state: State<'_, DbState>, query: String) -> Result<Vec<Value>, String> {
    state.with_conn(|conn| repo::search(conn, &query))
}

#[tauri::command]
pub fn folders_add_prompt(
    state: State<'_, DbState>,
    prompt_id: String,
    folder_id: String,
) -> Result<Value, String> {
    state.with_conn(|conn| repo::add_prompt(conn, &prompt_id, &folder_id))
}

#[tauri::command]
pub fn folders_remove_prompt(
    state: State<'_, DbState>,
    prompt_id: String,
    folder_id: String,
) -> Result<Value, String> {
    state.with_conn(|conn| repo::remove_prompt(conn, &prompt_id, &folder_id))
}

#[tauri::command]
pub fn folders_move_prompt(
    state: State<'_, DbState>,
    prompt_id: String,
    from_folder_id: String,
    to_folder_id: String,
) -> Result<Value, String> {
    state.with_conn(|conn| repo::move_prompt(conn, &prompt_id, &from_folder_id, &to_folder_id))
}

#[tauri::command]
pub fn folders_get_prompts(
    state: State<'_, DbState>,
    folder_id: String,
    options: Option<repo::FolderPromptOptions>,
) -> Result<Value, String> {
    let options = options.unwrap_or_default();
    state.with_conn(|conn| repo::get_prompts(conn, &folder_id, options))
}

#[tauri::command]
pub fn folders_get_prompt_folders(
    state: State<'_, DbState>,
    prompt_id: String,
) -> Result<Vec<Value>, String> {
    state.with_conn(|conn| repo::get_prompt_folders(conn, &prompt_id))
}
