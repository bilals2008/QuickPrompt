//! Tray icon and menu, ported from `electron/main.js` (`createTray`,
//! `buildTrayMenu`, `refreshTrayMenu`).
use tauri::menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, Wry};

use crate::db::DbState;
use crate::settings::SettingsStore;
use crate::window::{self, TRAY_ID};

/// Rebuild the context menu so its labels and checkboxes match the window.
pub fn refresh(app: &AppHandle) {
    let Some(tray) = app.tray_by_id(TRAY_ID) else { return };
    match build_menu(app) {
        Ok(menu) => {
            if let Err(err) = tray.set_menu(Some(menu)) {
                eprintln!("[Tray] Could not update the menu: {err}");
            }
        }
        Err(err) => eprintln!("[Tray] Could not build the menu: {err}"),
    }
}

fn build_menu(app: &AppHandle) -> tauri::Result<Menu<Wry>> {
    let settings = app.state::<SettingsStore>();
    let always_on_top = settings
        .get("alwaysOnTop", Some(serde_json::Value::Bool(false)))
        .as_bool()
        .unwrap_or(false);
    let visible = window::main_window(app)
        .and_then(|window| window.is_visible().ok())
        .unwrap_or(false);

    let toggle = MenuItem::with_id(
        app,
        "toggle",
        if visible {
            "Hide QuickPrompt"
        } else {
            "Open QuickPrompt"
        },
        true,
        None::<&str>,
    )?;
    let search = MenuItem::with_id(
        app,
        "quick-search",
        "Quick Search",
        true,
        Some("CmdOrCtrl+Alt+P"),
    )?;
    let always = CheckMenuItem::with_id(
        app,
        "always-on-top",
        "Always on Top",
        true,
        always_on_top,
        None::<&str>,
    )?;
    let mini_vault = MenuItem::with_id(
        app,
        "mini-vault",
        "Mini Vault",
        true,
        Some("CmdOrCtrl+Alt+L"),
    )?;
    let import_export = MenuItem::with_id(
        app,
        "import-export",
        "Import / Export…",
        true,
        None::<&str>,
    )?;
    let settings_item = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
    let updates = MenuItem::with_id(
        app,
        "check-updates",
        "Check for Updates…",
        true,
        None::<&str>,
    )?;
    let about = MenuItem::with_id(
        app,
        "about",
        "About QuickPrompt",
        true,
        None::<&str>,
    )?;
    let quit = MenuItem::with_id(app, "quit", "Quit QuickPrompt", true, Some("CmdOrCtrl+Q"))?;

    Menu::with_items(
        app,
        &[
            &toggle,
            &search,
            &PredefinedMenuItem::separator(app)?,
            &always,
            &PredefinedMenuItem::separator(app)?,
            &mini_vault,
            &import_export,
            &settings_item,
            &updates,
            &PredefinedMenuItem::separator(app)?,
            &about,
            &PredefinedMenuItem::separator(app)?,
            &quit,
        ],
    )
}

pub fn build(app: &AppHandle) -> tauri::Result<()> {
    let icon = app.default_window_icon().cloned();
    let menu = build_menu(app)?;

    let mut builder = TrayIconBuilder::with_id(TRAY_ID)
        .tooltip("QuickPrompt")
        .menu(&menu)
        // Left click toggles the window; only the right click opens the menu.
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if !cfg!(target_os = "macos") {
                    window::position_near_tray(app);
                }
                window::toggle(app);
            }
        });

    if let Some(icon) = icon {
        builder = builder.icon(icon);
    }
    builder.build(app)?;
    Ok(())
}

/// Quit through the same path as the window controls: close the database
/// first so no statement is in flight while the process ends.
pub fn quit(app: &AppHandle) {
    app.state::<DbState>().close();
    app.exit(0);
}

pub fn handle_menu_event(app: &AppHandle, id: &str) {
    match id {
        "toggle" => {
            window::toggle(app);
            refresh(app);
        }
        "quick-search" => {
            window::show_and_focus(app);
            window::emit(app, "qp:global-search", None);
            refresh(app);
        }
        "always-on-top" => {
            let settings = app.state::<SettingsStore>();
            let current = settings
                .get("alwaysOnTop", Some(serde_json::Value::Bool(false)))
                .as_bool()
                .unwrap_or(false);
            let next = !current;
            if let Some(window) = window::main_window(app) {
                let _ = window.set_always_on_top(next);
            }
            if let Err(err) = settings.set("alwaysOnTop", serde_json::Value::Bool(next)) {
                eprintln!("[Tray] Could not save alwaysOnTop: {err}");
            }
            refresh(app);
        }
        "mini-vault" => {
            window::show_and_focus(app);
            window::emit(app, "qp:navigate", Some("/vault"));
            if let Some(window) = window::main_window(app) {
                // Electron also grows the window to the medium preset here.
                window::apply_preset(&window, "medium");
            }
            refresh(app);
        }
        "import-export" => {
            window::show_and_focus(app);
            window::emit(app, "qp:navigate", Some("/import-export"));
            refresh(app);
        }
        "settings" | "check-updates" => {
            window::show_and_focus(app);
            window::emit(app, "qp:navigate", Some("/settings"));
            refresh(app);
        }
        "about" => {
            window::show_and_focus(app);
            window::emit(app, "qp:navigate", Some("/settings?section=about"));
            refresh(app);
        }
        "quit" => quit(app),
        _ => {}
    }
}
