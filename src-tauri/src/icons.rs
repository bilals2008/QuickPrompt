//! Custom folder icons, ported from `electron/folder-icons.js`.
//!
//! Uploaded images arrive as data URLs, are written to
//! `{app_data_dir}/QuickPrompt/folder-icons/<uuid>.<ext>`, and the database only
//! keeps a short `qpicon://icon/<name>` URL — the same location, naming and
//! stored value the Electron build used.
//!
//! On Windows (and Android) a custom scheme is served through
//! `http://qpicon.localhost/…`, so stored values are converted for display only
//! when a folder row leaves the repo. The database keeps the Electron form.
use std::borrow::Cow;
use std::path::{Path, PathBuf};

use base64::engine::general_purpose::STANDARD;
use base64::Engine;
use tauri::{AppHandle, Runtime};

use crate::db::data_dir;

pub const SCHEME: &str = "qpicon";
const DIR_NAME: &str = "folder-icons";
const MAX_FILE_BYTES: usize = 5 * 1024 * 1024;

/// Suffix a stored URL is served under by this platform's webview.
#[cfg(any(windows, target_os = "android"))]
const SERVED_ORIGIN: &str = "http://qpicon.localhost/";

fn icons_dir<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf, String> {
    Ok(data_dir(app)?.join(DIR_NAME))
}

fn content_type(ext: &str) -> &'static str {
    match ext {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "gif" => "image/gif",
        _ => "application/octet-stream",
    }
}

fn is_icon_name(name: &str) -> bool {
    let Some((stem, ext)) = name.rsplit_once('.') else {
        return false;
    };
    if stem.is_empty() {
        return false;
    }
    let allowed = stem
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-'));
    allowed
        && matches!(
            ext.to_ascii_lowercase().as_str(),
            "png" | "jpg" | "jpeg" | "webp" | "gif"
        )
}

/// Turn a `data:image/...` URL into an icon file and return its stored URL.
pub fn save<R: Runtime>(app: &AppHandle<R>, data_url: &str) -> Result<String, String> {
    let rest = data_url
        .strip_prefix("data:image/")
        .ok_or_else(|| "Unsupported image format".to_string())?;
    let (subtype, payload) = rest
        .split_once(";base64,")
        .ok_or_else(|| "Unsupported image format".to_string())?;
    let ext = match subtype {
        "png" => "png",
        "jpeg" | "jpg" => "jpg",
        "webp" => "webp",
        "gif" => "gif",
        _ => return Err("Unsupported image format".to_string()),
    };

    let bytes = STANDARD
        .decode(payload.trim())
        .map_err(|_| "Unsupported image format".to_string())?;
    if bytes.is_empty() {
        return Err("Empty image".to_string());
    }
    if bytes.len() > MAX_FILE_BYTES {
        return Err("Image is larger than 5 MB".to_string());
    }

    let dir = icons_dir(app)?;
    std::fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
    let name = format!("{}.{ext}", uuid::Uuid::new_v4());
    std::fs::write(dir.join(&name), &bytes).map_err(|err| err.to_string())?;
    Ok(stored_url(&name))
}

/// Delete the file behind a stored URL. Anything that is not our URL is ignored.
pub fn delete<R: Runtime>(app: &AppHandle<R>, url: &str) -> bool {
    let Some(name) = url.strip_prefix("qpicon://icon/") else {
        return false;
    };
    let name = name.split('?').next().unwrap_or(name);
    if !is_icon_name(name) {
        return false;
    }
    let Ok(dir) = icons_dir(app) else {
        return false;
    };
    std::fs::remove_file(dir.join(name)).is_ok()
}

fn stored_url(name: &str) -> String {
    format!("{SCHEME}://icon/{name}")
}

/// The URL form this webview can actually load. Stored values stay untouched.
pub fn display_url(stored: &str) -> String {
    #[cfg(any(windows, target_os = "android"))]
    {
        if let Some(name) = stored.strip_prefix("qpicon://icon/") {
            return format!("{SERVED_ORIGIN}icon/{name}");
        }
    }
    stored.to_string()
}

/// Serve `qpicon://icon/<name>` for the webview.
pub fn serve<R: Runtime>(
    app: &AppHandle<R>,
    request: tauri::http::Request<Vec<u8>>,
) -> tauri::http::Response<Cow<'static, [u8]>> {
    let path = request.uri().path().to_string();
    let name = path.rsplit('/').next().unwrap_or("");

    let not_found = || {
        tauri::http::Response::builder()
            .status(404)
            .header("Content-Type", "text/plain")
            .body(Cow::Borrowed(&b"Not found"[..]))
            .unwrap_or_else(|_| tauri::http::Response::new(Cow::Borrowed(&b"Not found"[..])))
    };

    if !is_icon_name(name) {
        return not_found();
    }
    let Ok(dir) = icons_dir(app) else {
        return not_found();
    };
    let Ok(bytes) = std::fs::read(dir.join(name)) else {
        return not_found();
    };

    let ext = Path::new(name)
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();

    tauri::http::Response::builder()
        .status(200)
        .header("Content-Type", content_type(&ext))
        // Icon file names are UUIDs, so the bytes behind a URL never change.
        .header("Cache-Control", "public, max-age=31536000, immutable")
        .body(Cow::Owned(bytes))
        .unwrap_or_else(|_| not_found())
}

#[cfg(test)]
mod tests {
    use super::{display_url, is_icon_name};

    #[test]
    fn only_accepts_icon_names_like_electron() {
        assert!(is_icon_name("2f1c6d1e-2b3a-4d5e-8f90-123456789abc.png"));
        assert!(is_icon_name("abc.jpeg"));
        assert!(!is_icon_name("../secrets.png"));
        assert!(!is_icon_name("abc.exe"));
        assert!(!is_icon_name(".png"));
    }

    #[test]
    fn keeps_the_stored_form_and_converts_only_for_display() {
        let stored = "qpicon://icon/abc.png";
        let shown = display_url(stored);

        #[cfg(any(windows, target_os = "android"))]
        assert_eq!(shown, "http://qpicon.localhost/icon/abc.png");
        #[cfg(not(any(windows, target_os = "android")))]
        assert_eq!(shown, stored);

        // Anything else passes through untouched.
        assert_eq!(display_url("tabler:rocket"), "tabler:rocket");
    }
}
