pub mod commands;
pub mod db;
pub mod repo;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .setup(|app| {
            let state = db::initialize(app.handle());
            app.manage(state);
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
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(|app_handle, event| {
        if let tauri::RunEvent::Exit = event {
            app_handle.state::<db::DbState>().close();
        }
    });
}
