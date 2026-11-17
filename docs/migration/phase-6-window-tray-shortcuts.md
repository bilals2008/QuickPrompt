# Phase 6 — Window, Tray, Menu, Shortcuts, Notifications, Shell

**Goal:** reproduce the desktop shell: window controls, tray menu, global shortcut, native notifications, open-external, and the popover/splash behaviour.

## Inputs

- `electron/main.js` (1034 lines) — the bulk of this phase.
- `electron/preload.js` — `windowAPI`, `notificationAPI`, `shellAPI`.

## Mapping

| Electron | Tauri 2 |
|----------|---------|
| `BrowserWindow` | `WebviewWindow` / `tauri::WebviewWindowBuilder` |
| window minimize/maximize/always-on-top/bounds/size | Tauri window API (`set_always_on_top`, `set_size`, `outer_position`, …) |
| `Tray` + `Menu` | `tauri::tray::TrayIcon` + menu builder |
| `globalShortcut` | `tauri-plugin-global-shortcut` |
| `Notification` | `tauri-plugin-notification` |
| `shell.openExternal` | `tauri-plugin-shell` / `tauri-plugin-opener` |
| `app.dock.hide()` (macOS) | `ActivationPolicy::Accessory` |
| `app.relaunch` | `tauri-plugin-process` (`restart`) |
| splash screen | second small window or in-app overlay |

## Steps

1. Recreate `createWindow` options: default size, min size, titlebar, background, `visible: false` until ready.
2. Port `windowAPI` 1:1 (11 methods) including `getBounds`, `setSize`, `setDefaultSize`, `showPopover`.
3. Tray: build the same menu, refresh on show/hide, open window near tray (`positionWindowNearTray`).
4. Close-to-tray / minimize-to-tray honouring `minimizeToTray` setting.
5. Global shortcut → emits the same `app:global-search` event; frontend already listens.
6. Notifications and `shell.openExternal`.
7. macOS: dock hide + activation policy; Windows/Linux unchanged.

## Done when

- [ ] Window controls behave identically (min/max/always-on-top/size presets/popover).
- [ ] Tray icon + menu match; window positions near tray.
- [ ] Close/minimize-to-tray respects settings.
- [ ] Global search shortcut opens Spotlight.
- [ ] Notifications and external links work.

## Risks

- Linux tray support depends on the desktop environment; document the fallback.
- Window position maths near the tray is platform-specific — test on Windows and macOS.
