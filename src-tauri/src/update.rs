//! Updater state and shared logic, ported from `electron/main.js`
//! (`autoUpdater`, the `update:*` handlers and `notifyRenderer`).
//!
//! The UI contract is unchanged: commands return the same shapes Electron's
//! IPC did and progress is pushed as `qp:update` DOM events with the same
//! payload keys (`status`, `version`, `releaseNotes`, `percent`,
//! `bytesPerSecond`, `total`, `transferred`, `error`).
use std::sync::{Mutex, MutexGuard};
use std::time::{Duration, Instant};

use serde_json::{json, Value};
use tauri::{AppHandle, Manager};
use tauri_plugin_updater::{Update, UpdaterExt};

use crate::settings::SettingsStore;
use crate::window;

pub const EVENT: &str = "qp:update";
pub const AUTO_CHECK_KEY: &str = "autoCheckUpdates";
pub const AUTO_DOWNLOAD_KEY: &str = "autoDownloadUpdates";

struct Snapshot {
    status: String,
    version: Option<String>,
    release_notes: Option<String>,
}

impl Default for Snapshot {
    fn default() -> Self {
        Self {
            status: "idle".to_string(),
            version: None,
            release_notes: None,
        }
    }
}

/// Shared between the commands, the tray menu and the startup task.
#[derive(Default)]
pub struct UpdateState {
    snapshot: Mutex<Snapshot>,
    pending: Mutex<Option<Update>>,
    package: Mutex<Option<Vec<u8>>>,
    downloading: Mutex<bool>,
}

impl UpdateState {
    pub fn new() -> Self {
        Self::default()
    }

    /// `update:get-status` shape: `{ status, ...updateInfo }`.
    pub fn snapshot(&self) -> Value {
        let snap = lock(&self.snapshot);
        let mut value = json!({ "status": snap.status });
        if let Some(version) = &snap.version {
            value["version"] = json!(version);
        }
        if let Some(notes) = &snap.release_notes {
            value["releaseNotes"] = json!(notes);
        }
        value
    }

    fn set_status(&self, status: &str) {
        lock(&self.snapshot).status = status.to_string();
    }

    fn set_info(&self, version: &str, notes: Option<String>) {
        let mut snap = lock(&self.snapshot);
        snap.version = Some(version.to_string());
        snap.release_notes = notes;
    }

    fn store_pending(&self, update: Update) {
        *lock(&self.pending) = Some(update);
    }

    fn pending(&self) -> Option<Update> {
        lock(&self.pending).clone()
    }

    fn store_package(&self, bytes: Vec<u8>) {
        *lock(&self.package) = Some(bytes);
    }

    fn take_package(&self) -> Option<Vec<u8>> {
        lock(&self.package).take()
    }

    /// Claims the single download slot; `false` means a download is running.
    fn begin_download(&self) -> bool {
        let mut flag = lock(&self.downloading);
        if *flag {
            return false;
        }
        *flag = true;
        true
    }

    fn end_download(&self) {
        *lock(&self.downloading) = false;
    }
}

fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
}

fn emit(app: &AppHandle, detail: Value) {
    window::emit_json(app, EVENT, detail);
}

pub fn auto_check_enabled(app: &AppHandle) -> bool {
    setting_bool(app, AUTO_CHECK_KEY, true)
}

fn auto_download_enabled(app: &AppHandle) -> bool {
    setting_bool(app, AUTO_DOWNLOAD_KEY, false)
}

fn setting_bool(app: &AppHandle, key: &str, fallback: bool) -> bool {
    app.state::<SettingsStore>()
        .get(key, Some(Value::Bool(fallback)))
        .as_bool()
        .unwrap_or(fallback)
}

/// `update:check`. Never fails: errors come back as `{ success: false }`, like
/// Electron's handler, so the UI keeps working when the plugin is unconfigured.
pub async fn check_now(app: &AppHandle) -> Value {
    app.state::<UpdateState>().set_status("checking");
    emit(app, json!({ "status": "checking" }));

    let result = match app.updater() {
        Ok(updater) => updater.check().await,
        Err(err) => Err(err),
    };

    match result {
        Ok(Some(update)) => {
            let version = update.version.clone();
            let notes = update.body.clone();
            {
                let state = app.state::<UpdateState>();
                state.set_info(&version, notes.clone());
                state.store_pending(update);
                state.set_status("available");
            }
            emit(
                app,
                json!({ "status": "available", "version": version, "releaseNotes": notes }),
            );
            if auto_download_enabled(app) {
                spawn_download(app.clone());
            }
            json!({ "success": true, "updateInfo": { "version": version, "releaseNotes": notes } })
        }
        Ok(None) => {
            app.state::<UpdateState>().set_status("idle");
            emit(app, json!({ "status": "idle" }));
            json!({ "success": true, "updateInfo": null })
        }
        Err(err) => {
            let message = err.to_string();
            app.state::<UpdateState>().set_status("error");
            emit(app, json!({ "status": "error", "error": message }));
            json!({ "success": false, "error": message })
        }
    }
}

/// `update:download`, also used by the auto-download path.
pub async fn download_now(app: &AppHandle) -> Value {
    if !app.state::<UpdateState>().begin_download() {
        return json!({ "success": false, "error": "Download already in progress" });
    }
    let result = download_inner(app).await;
    app.state::<UpdateState>().end_download();
    result
}

async fn download_inner(app: &AppHandle) -> Value {
    let Some(update) = app.state::<UpdateState>().pending() else {
        let message = "No update available to download".to_string();
        app.state::<UpdateState>().set_status("error");
        emit(app, json!({ "status": "error", "error": message }));
        return json!({ "success": false, "error": message });
    };

    app.state::<UpdateState>().set_status("downloading");
    let (version, notes) = info(app);

    // The plugin reports chunk length and total size only, so percent and
    // speed are accumulated here the way electron-updater reported them.
    let mut transferred: u64 = 0;
    let mut total: u64 = 0;
    let mut last = Instant::now();
    let mut bytes_per_second: f64 = 0.0;
    let progress_app = app.clone();

    let downloaded = update
        .download(
            move |chunk_len, content_len| {
                transferred += chunk_len as u64;
                if let Some(len) = content_len {
                    total = len;
                }
                let elapsed = last.elapsed().as_secs_f64();
                if elapsed > 0.0 {
                    bytes_per_second = chunk_len as f64 / elapsed;
                }
                last = Instant::now();
                let percent = if total > 0 {
                    (transferred as f64 / total as f64 * 100.0).round()
                } else {
                    0.0
                };
                emit(
                    &progress_app,
                    json!({
                        "status": "downloading",
                        "percent": percent,
                        "bytesPerSecond": bytes_per_second,
                        "total": total,
                        "transferred": transferred,
                    }),
                );
            },
            || {},
        )
        .await;

    match downloaded {
        Ok(bytes) => {
            {
                let state = app.state::<UpdateState>();
                state.store_package(bytes);
                state.set_status("downloaded");
            }
            emit(
                app,
                json!({ "status": "downloaded", "version": version, "releaseNotes": notes }),
            );
            json!({ "success": true })
        }
        Err(err) => {
            let message = err.to_string();
            app.state::<UpdateState>().set_status("error");
            emit(app, json!({ "status": "error", "error": message }));
            json!({ "success": false, "error": message })
        }
    }
}

fn info(app: &AppHandle) -> (Option<String>, Option<String>) {
    let snap = app.state::<UpdateState>().snapshot();
    (
        snap.get("version").and_then(|value| value.as_str()).map(str::to_string),
        snap.get("releaseNotes")
            .and_then(|value| value.as_str())
            .map(str::to_string),
    )
}

/// `update:install`: verify + install the cached package, then relaunch where
/// the platform needs it (Windows exits inside the installer itself).
pub fn install(app: &AppHandle) -> Result<(), String> {
    let Some(update) = app.state::<UpdateState>().pending() else {
        return Err("No update downloaded".to_string());
    };
    let Some(bytes) = app.state::<UpdateState>().take_package() else {
        return Err("No update downloaded".to_string());
    };

    update.install(bytes).map_err(|err| err.to_string())?;

    if !cfg!(windows) {
        let app = app.clone();
        std::thread::spawn(move || {
            std::thread::sleep(Duration::from_millis(150));
            app.restart();
        });
    }
    Ok(())
}

fn spawn_download(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let _ = download_now(&app).await;
    });
}

fn schedule_check_after(app: &AppHandle, delay: Duration) {
    let app = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(delay);
        tauri::async_runtime::spawn(async move {
            let _ = check_now(&app).await;
        });
    });
}

/// Same startup behaviour as Electron: check three seconds after launch when
/// `autoCheckUpdates` is on.
pub fn schedule_startup_check(app: &AppHandle) {
    if auto_check_enabled(app) {
        schedule_check_after(app, Duration::from_secs(3));
    }
}

/// The tray item waits 400ms so the Settings page is mounted before events
/// arrive, matching Electron's `setTimeout`.
pub fn schedule_menu_check(app: &AppHandle) {
    schedule_check_after(app, Duration::from_millis(400));
}
