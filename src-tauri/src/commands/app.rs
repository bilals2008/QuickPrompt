// App, notification and shell commands (see electron/preload.js
// `electronAPI`, `notificationAPI`, `shellAPI`).
use serde_json::{json, Value};
use tauri::State;
use tauri_plugin_notification::{NotificationExt, PermissionState};
use tauri_plugin_opener::OpenerExt;

use crate::settings::SettingsStore;

#[tauri::command]
pub fn app_get_version(app: tauri::AppHandle) -> String {
    app.package_info().version.to_string()
}

#[tauri::command]
pub fn app_get_platform(app: tauri::AppHandle) -> Value {
    let platform = if cfg!(windows) {
        "win32"
    } else if cfg!(target_os = "macos") {
        "darwin"
    } else {
        "linux"
    };
    // Windows and Linux always grant permission; on macOS a denied request is
    // the only case that counts as unsupported.
    let notifications_supported = !matches!(
        app.notification().permission_state(),
        Ok(PermissionState::Denied)
    );
    json!({
        "platform": platform,
        "isMac": cfg!(target_os = "macos"),
        "isWin": cfg!(windows),
        "isLinux": !cfg!(windows) && !cfg!(target_os = "macos"),
        "notificationsSupported": notifications_supported,
    })
}

#[tauri::command]
pub fn app_hide_window(app: tauri::AppHandle) -> Value {
    if let Some(window) = crate::window::main_window(&app) {
        let _ = window.hide();
    }
    json!({ "success": true })
}

#[tauri::command]
pub fn app_relaunch(app: tauri::AppHandle) -> Value {
    let handle = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(150));
        handle.restart();
    });
    Value::Null
}

#[tauri::command]
pub fn notification_show(
    app: tauri::AppHandle,
    settings: State<'_, SettingsStore>,
    title: Option<String>,
    body: Option<String>,
    _silent: Option<bool>,
) -> Value {
    if matches!(
        app.notification().permission_state(),
        Ok(PermissionState::Denied)
    ) {
        return json!({ "success": false, "reason": "unsupported" });
    }
    // Electron treats anything but `true` as disabled.
    if !settings
        .get("notifications", Some(Value::Bool(false)))
        .as_bool()
        .unwrap_or(false)
    {
        return json!({ "success": false, "reason": "disabled" });
    }

    match app
        .notification()
        .builder()
        .title(title.unwrap_or_default())
        .body(body.unwrap_or_default())
        .show()
    {
        Ok(()) => json!({ "success": true }),
        Err(err) => {
            eprintln!("[Notifications] Could not show: {err}");
            json!({ "success": false, "reason": err.to_string() })
        }
    }
}

#[tauri::command]
pub fn shell_open_external(app: tauri::AppHandle, url: String) -> Value {
    if !(url.starts_with("http://") || url.starts_with("https://")) {
        return json!({ "success": false });
    }
    match app.opener().open_url(&url, None::<&str>) {
        Ok(()) => json!({ "success": true }),
        Err(err) => {
            eprintln!("[Shell] Could not open {url}: {err}");
            json!({ "success": false })
        }
    }
}
