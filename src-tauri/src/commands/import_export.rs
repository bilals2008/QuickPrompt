// Import/export file dialogs (see electron/main.js `import-export:*`).
use serde::Deserialize;
use serde_json::{json, Value};
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct SaveFileRequest {
    pub content: String,
    pub format: String,
    pub suggested_name: Option<String>,
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct OpenFileRequest {
    pub format: Option<String>,
}

/// (display name, extension, extensions accepted by the filter)
fn formats(format: &str) -> Option<(&'static str, &'static str, &'static [&'static str])> {
    match format {
        "json" => Some(("JSON", "json", &["json"])),
        "csv" => Some(("CSV", "csv", &["csv"])),
        "markdown" => Some(("Markdown", "md", &["md", "markdown"])),
        _ => None,
    }
}

#[tauri::command]
pub async fn import_export_save_file(app: AppHandle, request: SaveFileRequest) -> Value {
    if request.content.is_empty() {
        return json!({ "success": false, "reason": "empty-content" });
    }
    let Some((name, _ext, extensions)) = formats(&request.format) else {
        return json!({ "success": false, "reason": "unknown-format" });
    };

    let default_name = match request.suggested_name {
        Some(name) if !name.is_empty() => name,
        _ => format!("quickprompts-{}", chrono::Local::now().format("%Y-%m-%d")),
    };

    let picked = app
        .dialog()
        .file()
        .set_title("Export prompts")
        .set_file_name(&default_name)
        .add_filter(name, extensions)
        .add_filter("All files", &["*"])
        .blocking_save_file();

    let Some(path) = picked.and_then(|file| file.into_path().ok()) else {
        return json!({ "success": false, "reason": "canceled" });
    };

    match std::fs::write(&path, request.content.as_bytes()) {
        Ok(()) => json!({ "success": true, "filePath": path.to_string_lossy() }),
        Err(err) => json!({ "success": false, "reason": "write-failed", "error": err.to_string() }),
    }
}

#[tauri::command]
pub async fn import_export_open_file(app: AppHandle, request: OpenFileRequest) -> Value {
    let picked = app
        .dialog()
        .file()
        .set_title("Import prompts")
        .add_filter("JSON", &["json"])
        .add_filter("CSV", &["csv"])
        .add_filter("Markdown", &["md", "markdown"])
        .blocking_pick_file();

    let Some(path) = picked.and_then(|file| file.into_path().ok()) else {
        return json!({ "success": false, "reason": "canceled" });
    };

    match std::fs::read(&path) {
        // Electron read these files as utf-8, which replaces invalid bytes.
        Ok(bytes) => json!({
            "success": true,
            "filePath": path.to_string_lossy(),
            "content": String::from_utf8_lossy(&bytes),
            "format": request.format,
        }),
        Err(err) => json!({ "success": false, "reason": "read-failed", "error": err.to_string() }),
    }
}
