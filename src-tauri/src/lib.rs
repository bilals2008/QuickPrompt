pub mod backup;
pub mod commands;
pub mod crypto;
pub mod db;
pub mod icons;
pub mod repo;
pub mod settings;
pub mod tray;
pub mod window;

use tauri::Manager;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

const QUICK_SEARCH_ACCEL: &str = "CmdOrCtrl+Alt+P";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        // Custom folder icons, served at `qpicon://icon/<name>` (macOS/Linux)
        // and `http://qpicon.localhost/icon/<name>` (Windows/Android).
        .register_uri_scheme_protocol(icons::SCHEME, |context, request| {
            icons::serve(context.app_handle(), request)
        })
        .on_menu_event(|app, event| tray::handle_menu_event(app, event.id().as_ref()))
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                // Closing hides to the tray unless the user asked to quit.
                api.prevent_close();
                commands::window::handle_close(window.app_handle());
            }
            tauri::WindowEvent::Focused(_) => tray::refresh(window.app_handle()),
            tauri::WindowEvent::Resized(_) => {
                // Optional tray behaviour for the minimise button, off by
                // default: the window just minimises to the taskbar.
                let app = window.app_handle();
                let minimize_to_tray = app
                    .state::<settings::SettingsStore>()
                    .get("minimizeToTray", Some(serde_json::Value::Bool(false)))
                    .as_bool()
                    .unwrap_or(false);
                if minimize_to_tray && window.is_minimized().unwrap_or(false) {
                    let _ = window.unminimize();
                    let _ = window.hide();
                }
            }
            _ => {}
        })
        .setup(|app| {
            let state = db::initialize(app.handle());
            app.manage(state);
            app.manage(crypto::VaultCipher::load());
            app.manage(settings::SettingsStore::load(app.handle()));

            tray::build(app.handle())?;
            register_quick_search(app.handle());

            if let Some(window) = app.get_webview_window(window::MAIN_WINDOW) {
                let settings = app.state::<settings::SettingsStore>();
                let always_on_top = settings
                    .get("alwaysOnTop", Some(serde_json::Value::Bool(false)))
                    .as_bool()
                    .unwrap_or(false);
                let _ = window.set_always_on_top(always_on_top);
                if settings
                    .get("startMinimized", Some(serde_json::Value::Bool(false)))
                    .as_bool()
                    .unwrap_or(false)
                {
                    let _ = window.hide();
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::db::db_health,
            commands::prompts::prompts_create,
            commands::prompts::prompts_get_all,
            commands::prompts::prompts_get_paginated,
            commands::prompts::prompts_update,
            commands::prompts::prompts_delete,
            commands::prompts::prompts_get_all_tags,
            commands::prompts::prompts_create_tag,
            commands::prompts::prompts_search,
            commands::prompts::prompts_toggle_favorite,
            commands::prompts::prompts_update_order,
            commands::folders::folders_create,
            commands::folders::folders_list,
            commands::folders::folders_roots,
            commands::folders::folders_children,
            commands::folders::folders_get,
            commands::folders::folders_breadcrumb,
            commands::folders::folders_rename,
            commands::folders::folders_update,
            commands::folders::folders_delete,
            commands::folders::folders_search,
            commands::folders::folders_add_prompt,
            commands::folders::folders_remove_prompt,
            commands::folders::folders_move_prompt,
            commands::folders::folders_get_prompts,
            commands::folders::folders_get_prompt_folders,
            commands::vault_folders::vault_folders_create,
            commands::vault_folders::vault_folders_list,
            commands::vault_folders::vault_folders_roots,
            commands::vault_folders::vault_folders_children,
            commands::vault_folders::vault_folders_breadcrumb,
            commands::vault_folders::vault_folders_rename,
            commands::vault_folders::vault_folders_update,
            commands::vault_folders::vault_folders_delete,
            commands::vault_folders::vault_folders_add_item,
            commands::vault_folders::vault_folders_remove_item,
            commands::vault_folders::vault_folders_get_items,
            commands::vault_folders::vault_folders_get_item_folders,
            commands::vault_folders::vault_folders_search,
            commands::vault::vault_health,
            commands::vault::vault_create,
            commands::vault::vault_list,
            commands::vault::vault_get,
            commands::vault::vault_update,
            commands::vault::vault_toggle_favorite,
            commands::vault::vault_toggle_pin,
            commands::vault::vault_update_order,
            commands::vault::vault_delete,
            commands::vault::vault_copy,
            commands::vault::vault_attachments_list,
            commands::vault::vault_attachments_create,
            commands::vault::vault_attachments_delete,
            commands::vault::vault_attachments_download,
            commands::settings::settings_get,
            commands::settings::settings_set,
            commands::settings::settings_pick_folder,
            commands::fs::fs_read_dir,
            commands::fs::fs_get_drives,
            commands::import_export::import_export_save_file,
            commands::import_export::import_export_open_file,
            commands::backup::backup_create,
            commands::backup::backup_restore,
            commands::backup::backup_pick_file,
            commands::backup::backup_set_passphrase,
            commands::backup::backup_has_passphrase,
            commands::window::window_minimize,
            commands::window::window_maximize,
            commands::window::window_toggle_maximize,
            commands::window::window_is_maximized,
            commands::window::window_unmaximize,
            commands::window::window_hide,
            commands::window::window_close_to_tray,
            commands::window::window_quit,
            commands::window::app_quit,
            commands::window::window_set_always_on_top,
            commands::window::window_get_always_on_top,
            commands::window::window_toggle_always_on_top,
            commands::window::window_get_bounds,
            commands::window::window_set_size,
            commands::window::window_set_default_size,
            commands::window::window_show_popover,
            commands::app::app_get_version,
            commands::app::app_get_platform,
            commands::app::app_hide_window,
            commands::app::app_relaunch,
            commands::app::notification_show,
            commands::app::shell_open_external,
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(|app_handle, event| {
        if let tauri::RunEvent::Exit = event {
            app_handle.state::<db::DbState>().close();
        }
    });
}

/// The quick-search accelerator opens the window and asks the UI to focus its
/// search field, as `app:global-search` did under Electron.
fn register_quick_search(app: &tauri::AppHandle) {
    let result = app
        .global_shortcut()
        .on_shortcut(QUICK_SEARCH_ACCEL, |app, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                window::show_and_focus(app);
                window::emit(app, "qp:global-search", None);
            }
        });
    match result {
        Ok(()) => println!("[Main] Global shortcut registered: {QUICK_SEARCH_ACCEL}"),
        Err(err) => eprintln!("[Main] Failed to register global shortcut {QUICK_SEARCH_ACCEL}: {err}"),
    }
}
