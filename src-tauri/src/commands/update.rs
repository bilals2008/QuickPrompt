// Updater commands (see electron/preload.js `updateAPI` and main.js
// `update:*` handlers). The behaviour lives in `crate::update`.
use serde_json::Value;
use tauri::{AppHandle, Manager, State};

use crate::settings::SettingsStore;
use crate::update::{self, UpdateState, AUTO_CHECK_KEY, AUTO_DOWNLOAD_KEY};

#[tauri::command]
pub async fn update_check(app: AppHandle) -> Value {
    update::check_now(&app).await
}

#[tauri::command]
pub async fn update_download(app: AppHandle) -> Value {
    update::download_now(&app).await
}

#[tauri::command]
pub fn update_install(app: AppHandle) -> Result<Value, String> {
    update::install(&app)?;
    Ok(Value::Null)
}

#[tauri::command]
pub fn update_get_status(app: AppHandle) -> Value {
    app.state::<UpdateState>().snapshot()
}

#[tauri::command]
pub fn update_set_auto_check(
    settings: State<'_, SettingsStore>,
    enabled: bool,
) -> Result<Value, String> {
    settings.set(AUTO_CHECK_KEY, Value::Bool(enabled))?;
    Ok(Value::Null)
}

#[tauri::command]
pub fn update_get_auto_check(settings: State<'_, SettingsStore>) -> bool {
    settings
        .get(AUTO_CHECK_KEY, Some(Value::Bool(true)))
        .as_bool()
        .unwrap_or(true)
}

#[tauri::command]
pub fn update_set_auto_download(
    settings: State<'_, SettingsStore>,
    enabled: bool,
) -> Result<Value, String> {
    settings.set(AUTO_DOWNLOAD_KEY, Value::Bool(enabled))?;
    Ok(Value::Null)
}

#[tauri::command]
pub fn update_get_auto_download(settings: State<'_, SettingsStore>) -> bool {
    settings
        .get(AUTO_DOWNLOAD_KEY, Some(Value::Bool(false)))
        .as_bool()
        .unwrap_or(false)
}
