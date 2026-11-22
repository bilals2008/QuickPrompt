//! Window behaviour, ported from `electron/main.js` (`createWindow`,
//! `showAndFocus`, `toggleWindow`, `positionWindowNearTray`, `clampToScreen`).
//!
//! QuickPrompt is a compact companion window: the width is capped at 500 so the
//! app can never become a full-width layout, and the tray popover opens next to
//! the tray icon with the same maths Electron used.
use tauri::{
    AppHandle, LogicalSize, Manager, PhysicalPosition, PhysicalSize, Position, Size, WebviewWindow,
};

pub const MAIN_WINDOW: &str = "main";
pub const TRAY_ID: &str = "main-tray";

const MIN_WIDTH: f64 = 360.0;
const MAX_WIDTH: f64 = 500.0;
const MIN_HEIGHT: f64 = 320.0;

/// `WINDOW_PRESETS` from main.js; anything unknown falls back to `medium`.
pub fn preset(name: &str) -> (f64, f64) {
    match name {
        "mini" => (360.0, 520.0),
        "medium" => (500.0, 700.0),
        "full" => (500.0, 900.0),
        _ => (500.0, 700.0),
    }
}

pub fn main_window(app: &AppHandle) -> Option<WebviewWindow> {
    app.get_webview_window(MAIN_WINDOW)
}

fn is_visible(window: &WebviewWindow) -> bool {
    window.is_visible().unwrap_or(false)
}

/// Keep the window inside the width cap and the monitor's height.
pub fn clamp_size(window: &WebviewWindow, width: f64, height: f64) -> (f64, f64) {
    let max_height = window
        .current_monitor()
        .ok()
        .flatten()
        .map(|monitor| {
            let scale = monitor.scale_factor();
            monitor.size().height as f64 / scale
        })
        .unwrap_or(f64::MAX);

    (
        width.clamp(MIN_WIDTH, MAX_WIDTH),
        height.max(MIN_HEIGHT).min(max_height),
    )
}

/// Show the window next to the tray, restoring it from a minimised state.
pub fn show_and_focus(app: &AppHandle) {
    let Some(window) = main_window(app) else { return };
    if !is_visible(&window) {
        position_near_tray(app);
    }
    if window.is_minimized().unwrap_or(false) {
        let _ = window.unminimize();
    }
    let _ = window.show();
    let _ = window.set_focus();
}

/// Tray click: hide when the window is already in front, otherwise show it.
pub fn toggle(app: &AppHandle) {
    let Some(window) = main_window(app) else { return };
    let focused = window.is_focused().unwrap_or(false);
    if is_visible(&window) && focused {
        let _ = window.hide();
    } else {
        show_and_focus(app);
    }
}

/// Place the window beside the tray icon, like `positionWindowNearTray`.
pub fn position_near_tray(app: &AppHandle) {
    let Some(window) = main_window(app) else { return };
    let Some(tray) = app.tray_by_id(TRAY_ID) else { return };
    let Ok(Some(rect)) = tray.rect() else { return };
    let Ok(Some(monitor)) = window.current_monitor() else { return };

    let scale = window.scale_factor().unwrap_or(1.0);
    // The tray reports its rect in physical or logical pixels depending on the
    // platform, so normalise everything to physical before doing the maths.
    let (tray_x, tray_y) = match rect.position {
        Position::Physical(point) => (point.x, point.y),
        Position::Logical(point) => (
            (point.x * scale).round() as i32,
            (point.y * scale).round() as i32,
        ),
    };
    let (tray_w, tray_h) = match rect.size {
        Size::Physical(size) => (size.width as i32, size.height as i32),
        Size::Logical(size) => (
            (size.width * scale).round() as i32,
            (size.height * scale).round() as i32,
        ),
    };
    if tray_w == 0 && tray_h == 0 {
        return;
    }
    let margin = (8.0 * scale) as i32;
    let offset = (4.0 * scale) as i32;

    let size = window
        .outer_size()
        .unwrap_or_else(|_| PhysicalSize::new(MAX_WIDTH as u32, 700));
    let area = monitor.work_area();
    let (area_x, area_y) = (area.position.x, area.position.y);
    let (area_w, area_h) = (area.size.width as i32, area.size.height as i32);
    let win_w = size.width as i32;
    let win_h = size.height as i32;

    let mut x = tray_x + tray_w / 2 - win_w / 2;
    let tray_center_y = tray_y + tray_h / 2;
    let is_top_half = tray_center_y < area_y + area_h / 2;
    let mut y = if is_top_half {
        tray_y + tray_h + offset
    } else {
        tray_y - win_h - offset
    };

    x = x.max(area_x + margin).min(area_x + area_w - win_w - margin);
    y = y.max(area_y + margin).min(area_y + area_h - win_h - margin);

    if let Err(err) = window.set_position(Position::Physical(PhysicalPosition::new(x, y))) {
        eprintln!("[Main] popover positioning failed: {err}");
    }
}

/// Resize to a preset and re-centre, like `window:set-default-size`.
pub fn apply_preset(window: &WebviewWindow, name: &str) {
    let (width, height) = preset(name);
    let (width, height) = clamp_size(window, width, height);
    let _ = window.set_size(LogicalSize::new(width, height));
    let _ = window.center();
}

/// Push an event carrying a string to the webview. The React app listens for
/// these as DOM events, so no extra JS package is needed to bridge them.
pub fn emit(app: &AppHandle, event: &str, detail: Option<&str>) {
    emit_json(
        app,
        event,
        detail
            .map(|value| serde_json::Value::String(value.to_string()))
            .unwrap_or(serde_json::Value::Null),
    );
}

/// Same as [`emit`], but the payload is any JSON value.
pub fn emit_json(app: &AppHandle, event: &str, detail: serde_json::Value) {
    let Some(window) = main_window(app) else { return };
    let detail = serde_json::to_string(&detail).unwrap_or_else(|_| "null".to_string());
    let script =
        format!("window.dispatchEvent(new CustomEvent('{event}', {{ detail: {detail} }}));");
    if let Err(err) = window.eval(&script) {
        eprintln!("[Main] Could not emit {event}: {err}");
    }
}
