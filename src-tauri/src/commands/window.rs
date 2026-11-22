// Window commands (see electron/preload.js `windowAPI`).
use serde_json::{json, Value};
use tauri::{Manager, State, WebviewWindow};

use crate::db::DbState;
use crate::settings::SettingsStore;
use crate::tray;
use crate::window as shell;

fn window_of(app: &tauri::AppHandle) -> Option<WebviewWindow> {
    shell::main_window(app)
}

#[tauri::command]
pub fn window_minimize(window: WebviewWindow) -> Value {
    let _ = window.minimize();
    Value::Null
}

#[tauri::command]
pub fn window_maximize() -> Value {
    // Disabled: the app window is width-capped by design.
    json!({ "success": false, "reason": "maximize-disabled" })
}

#[tauri::command]
pub fn window_toggle_maximize() -> Value {
    json!({ "success": false, "maximized": false, "reason": "maximize-disabled" })
}

#[tauri::command]
pub fn window_is_maximized(window: WebviewWindow) -> bool {
    window.is_maximized().unwrap_or(false)
}

#[tauri::command]
pub fn window_unmaximize(window: WebviewWindow) -> Value {
    let _ = window.unmaximize();
    Value::Null
}

#[tauri::command]
pub fn window_hide(window: WebviewWindow) -> Value {
    let _ = window.hide();
    Value::Null
}

#[tauri::command]
pub fn window_close_to_tray(
    app: tauri::AppHandle,
    settings: State<'_, SettingsStore>,
) -> Value {
    let behavior = settings
        .get("closeBehavior", Some(Value::from("tray")))
        .as_str()
        .unwrap_or("tray")
        .to_string();
    if behavior == "quit" {
        tray::quit(&app);
    } else if let Some(window) = window_of(&app) {
        let _ = window.hide();
    }
    Value::Null
}

#[tauri::command]
pub fn window_quit(app: tauri::AppHandle) -> Value {
    tray::quit(&app);
    Value::Null
}

#[tauri::command]
pub fn window_set_always_on_top(
    app: tauri::AppHandle,
    settings: State<'_, SettingsStore>,
    value: bool,
) -> Value {
    let Some(window) = window_of(&app) else {
        return json!({ "success": false });
    };
    let _ = window.set_always_on_top(value);
    if let Err(err) = settings.set("alwaysOnTop", Value::Bool(value)) {
        eprintln!("[Main] Could not save alwaysOnTop: {err}");
    }
    json!({ "success": true, "value": window.is_always_on_top().unwrap_or(value) })
}

#[tauri::command]
pub fn window_get_always_on_top(window: WebviewWindow) -> bool {
    window.is_always_on_top().unwrap_or(false)
}

#[tauri::command]
pub fn window_toggle_always_on_top(
    app: tauri::AppHandle,
    settings: State<'_, SettingsStore>,
) -> Value {
    let Some(window) = window_of(&app) else {
        return json!({ "success": false, "value": false });
    };
    let next = !window.is_always_on_top().unwrap_or(false);
    let _ = window.set_always_on_top(next);
    if let Err(err) = settings.set("alwaysOnTop", Value::Bool(next)) {
        eprintln!("[Main] Could not save alwaysOnTop: {err}");
    }
    json!({ "success": true, "value": next })
}

#[tauri::command]
pub fn window_get_bounds(window: WebviewWindow) -> Value {
    let (Ok(position), Ok(size)) = (window.outer_position(), window.outer_size()) else {
        return Value::Null;
    };
    let scale = window.scale_factor().unwrap_or(1.0);
    json!({
        "x": (position.x as f64 / scale).round() as i64,
        "y": (position.y as f64 / scale).round() as i64,
        "width": (size.width as f64 / scale).round() as i64,
        "height": (size.height as f64 / scale).round() as i64,
    })
}

#[tauri::command]
pub fn window_set_size(window: WebviewWindow, width: f64, height: f64) -> Value {
    let (width, height) = shell::clamp_size(&window, width.round(), height.round());
    let _ = window.set_size(tauri::LogicalSize::new(width, height));
    json!({ "success": true, "width": width, "height": height })
}

#[tauri::command]
pub fn window_set_default_size(
    app: tauri::AppHandle,
    preset: Option<String>,
) -> Value {
    let Some(window) = window_of(&app) else {
        return json!({ "success": false });
    };
    shell::apply_preset(&window, preset.as_deref().unwrap_or("medium"));
    json!({ "success": true })
}

#[tauri::command]
pub fn window_show_popover(app: tauri::AppHandle) -> Value {
    let Some(window) = window_of(&app) else {
        return json!({ "success": false });
    };
    shell::position_near_tray(&app);
    let _ = window.show();
    let _ = window.set_focus();
    json!({ "success": true })
}

/// Shared by the close handler: quit or hide according to `closeBehavior`.
pub fn handle_close(app: &tauri::AppHandle) {
    let behavior = app
        .state::<SettingsStore>()
        .get("closeBehavior", Some(Value::from("tray")))
        .as_str()
        .unwrap_or("tray")
        .to_string();
    if behavior == "quit" {
        tray::quit(app);
    } else if let Some(window) = window_of(app) {
        let _ = window.hide();
    }
}

#[tauri::command]
pub fn app_quit(app: tauri::AppHandle) -> Value {
    app.state::<DbState>().close();
    app.exit(0);
    Value::Null
}
