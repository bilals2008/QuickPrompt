// Settings commands (see electron/preload.js `settingsAPI`).
use serde_json::Value;
use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;

use crate::settings::SettingsStore;

#[tauri::command]
pub fn settings_get(
    state: State<'_, SettingsStore>,
    key: String,
    fallback: Option<Value>,
) -> Value {
    state.get(&key, fallback)
}

#[tauri::command]
pub fn settings_set(
    state: State<'_, SettingsStore>,
    key: String,
    value: Value,
) -> Result<Value, String> {
    state.set(&key, value)?;
    Ok(Value::Null)
}

#[tauri::command]
pub async fn settings_pick_folder(app: AppHandle) -> Value {
    let picked = app
        .dialog()
        .file()
        .set_title("Select backup folder")
        .blocking_pick_folder();

    match picked.and_then(|folder| folder.into_path().ok()) {
        Some(path) => serde_json::json!({ "success": true, "path": path.to_string_lossy() }),
        None => serde_json::json!({ "success": false }),
    }
}
