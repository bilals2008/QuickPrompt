// Thin command wrappers over `repo::prompts`. Names mirror the Electron IPC
// channels; arguments keep the JS calling convention.
use serde_json::Value;
use tauri::State;

use crate::db::DbState;
use crate::repo::prompts as repo;

#[tauri::command]
pub fn prompts_create(state: State<'_, DbState>, data: repo::NewPrompt) -> Result<Value, String> {
    state.with_conn(|conn| repo::create(conn, data))
}

#[tauri::command]
pub fn prompts_get_all(state: State<'_, DbState>) -> Result<Vec<Value>, String> {
    state.with_conn(repo::get_all)
}

#[tauri::command]
pub fn prompts_get_paginated(
    state: State<'_, DbState>,
    options: Option<repo::PaginatedOptions>,
) -> Result<Value, String> {
    let options = options.unwrap_or_default();
    state.with_conn(|conn| repo::get_paginated(conn, options))
}

#[tauri::command]
pub fn prompts_update(
    state: State<'_, DbState>,
    id: String,
    data: repo::UpdatePrompt,
) -> Result<Option<Value>, String> {
    state.with_conn(|conn| repo::update(conn, &id, data))
}

#[tauri::command]
pub fn prompts_delete(state: State<'_, DbState>, id: String) -> Result<Value, String> {
    state.with_conn(|conn| repo::delete(conn, &id))
}

#[tauri::command]
pub fn prompts_get_all_tags(state: State<'_, DbState>) -> Result<Vec<Value>, String> {
    state.with_conn(repo::get_all_tags)
}

#[tauri::command]
pub fn prompts_create_tag(state: State<'_, DbState>, name: String) -> Result<Value, String> {
    state.with_conn(|conn| repo::create_tag(conn, &name))
}

#[tauri::command]
pub fn prompts_search(state: State<'_, DbState>, query: String) -> Result<Vec<Value>, String> {
    state.with_conn(|conn| repo::search(conn, &query))
}

#[tauri::command]
pub fn prompts_toggle_favorite(state: State<'_, DbState>, id: String) -> Result<Value, String> {
    state.with_conn(|conn| repo::toggle_favorite(conn, &id))
}

#[tauri::command]
pub fn prompts_update_order(
    state: State<'_, DbState>,
    updates: Vec<repo::OrderUpdate>,
) -> Result<Value, String> {
    state.with_conn(|conn| repo::update_order(conn, updates))
}
