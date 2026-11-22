// Filesystem helpers (see electron/preload.js `fsAPI`).
use serde_json::{json, Value};

#[tauri::command]
pub fn fs_read_dir(dir_path: String) -> Value {
    let entries = match std::fs::read_dir(&dir_path) {
        Ok(entries) => entries,
        Err(err) => return json!({ "success": false, "error": err.to_string() }),
    };

    let items: Vec<Value> = entries
        .flatten()
        .map(|entry| {
            let metadata = entry.metadata().ok();
            let modified = metadata
                .as_ref()
                .and_then(|meta| meta.modified().ok())
                .map(iso_time);
            json!({
                "name": entry.file_name().to_string_lossy(),
                "isDirectory": entry.file_type().map(|kind| kind.is_dir()).unwrap_or(false),
                "isFile": entry.file_type().map(|kind| kind.is_file()).unwrap_or(false),
                "size": metadata.map(|meta| meta.len()).unwrap_or(0),
                "modifiedAt": modified,
            })
        })
        .collect();

    json!({ "success": true, "items": items })
}

#[tauri::command]
pub fn fs_get_drives() -> Value {
    json!({ "success": true, "drives": drives() })
}

fn iso_time(time: std::time::SystemTime) -> String {
    let stamp: chrono::DateTime<chrono::Utc> = time.into();
    stamp.to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
}

/// Drive roots as `C:` strings, like the `wmic logicaldisk` output Electron
/// parsed. Probing the letters avoids shelling out to a deprecated tool.
fn drives() -> Vec<String> {
    if cfg!(windows) {
        let found: Vec<String> = ('A'..='Z')
            .filter(|letter| std::fs::metadata(format!("{letter}:\\")).is_ok())
            .map(|letter| format!("{letter}:"))
            .collect();
        if found.is_empty() {
            return vec!["C:\\".to_string()];
        }
        return found;
    }
    vec!["/".to_string()]
}
