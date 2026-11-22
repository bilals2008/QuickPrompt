//! Settings store, ported from `electron/main.js` (`readSettings` /
//! `writeSettings` / `getSetting` / `setSetting`).
//!
//! Same file as Electron writes — `{app_data_dir}/QuickPrompt/settings.json`,
//! pretty-printed with two spaces — so both shells read each other's values and
//! no user setting is lost when the Tauri shell takes over.
use std::path::{Path, PathBuf};
use std::sync::{Mutex, MutexGuard};

use serde_json::{Map, Value};
use tauri::{AppHandle, Runtime};

use crate::db::data_dir;

pub const FILE_NAME: &str = "settings.json";

pub struct SettingsStore {
    path: PathBuf,
    cache: Mutex<Map<String, Value>>,
}

impl SettingsStore {
    pub fn load<R: Runtime>(app: &AppHandle<R>) -> Self {
        let path = data_dir(app)
            .map(|dir| dir.join(FILE_NAME))
            .unwrap_or_else(|err| {
                eprintln!("[Settings] Could not resolve the settings path: {err}");
                PathBuf::from(FILE_NAME)
            });
        Self::at(path)
    }

    /// Used by `load` and by tests, which point at a temp directory.
    pub fn at(path: PathBuf) -> Self {
        let cache = read_file(&path).unwrap_or_else(|err| {
            eprintln!("[Settings] Ignoring unreadable settings file: {err}");
            Map::new()
        });
        Self {
            path,
            cache: Mutex::new(cache),
        }
    }

    /// `settings[key] ?? fallback`, exactly like Electron's `getSetting`.
    pub fn get(&self, key: &str, fallback: Option<Value>) -> Value {
        self.lock()
            .get(key)
            .cloned()
            .or(fallback)
            .unwrap_or(Value::Null)
    }

    pub fn set(&self, key: &str, value: Value) -> Result<(), String> {
        let mut guard = self.lock();
        guard.insert(key.to_string(), value);
        write_file(&self.path, &guard)
    }

    pub fn has_non_empty(&self, key: &str) -> bool {
        match self.lock().get(key) {
            Some(Value::String(text)) => !text.is_empty(),
            Some(Value::Null) | None => false,
            Some(_) => true,
        }
    }

    fn lock(&self) -> MutexGuard<'_, Map<String, Value>> {
        // A poisoned lock only means another thread panicked mid-write; the
        // cached values are still consistent enough to keep serving.
        self.cache
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
    }
}

fn read_file(path: &Path) -> Result<Map<String, Value>, String> {
    if !path.exists() {
        return Ok(Map::new());
    }
    let raw = std::fs::read_to_string(path).map_err(|err| err.to_string())?;
    match serde_json::from_str::<Value>(&raw) {
        Ok(Value::Object(map)) => Ok(map),
        Ok(_) => Ok(Map::new()),
        Err(err) => Err(err.to_string()),
    }
}

fn write_file(path: &Path, data: &Map<String, Value>) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }
    let json = serde_json::to_string_pretty(&Value::Object(data.clone()))
        .map_err(|err| err.to_string())?;
    std::fs::write(path, json).map_err(|err| err.to_string())
}

#[cfg(test)]
mod tests {
    use super::SettingsStore;
    use serde_json::json;

    #[test]
    fn falls_back_like_electron_and_persists_to_disk() {
        let dir = tempfile::tempdir().expect("temp dir");
        let path = dir.path().join("settings.json");

        let store = SettingsStore::at(path.clone());
        assert_eq!(store.get("missing", Some(json!("fallback"))), json!("fallback"));
        assert_eq!(store.get("missing", None), json!(null));

        store.set("backupRetention", json!(7)).expect("write");
        store.set("backupLocation", json!("D:/Backups")).expect("write");

        // A second store reading the same file sees what the first wrote.
        let reopened = SettingsStore::at(path);
        assert_eq!(reopened.get("backupRetention", None), json!(7));
        assert_eq!(reopened.get("backupLocation", None), json!("D:/Backups"));
    }
}
