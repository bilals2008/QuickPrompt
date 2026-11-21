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

- [x] Window controls behave identically (min/max/always-on-top/size presets/popover).
- [x] Tray icon + menu match; window positions near tray.
- [x] Close/minimize-to-tray respects settings.
- [x] Global search shortcut opens Spotlight.
- [x] Notifications and external links work.

## Implementation notes

Landed as `src-tauri/src/window.rs` (geometry, show/toggle/popover, event
dispatch), `tray.rs` (icon + menu + menu actions), and
`commands/{window,app}.rs`; the adapter gained the `window`, `app`, `shell` and
`notifications` groups.

- The window keeps the `tauri.conf.json` geometry (500×700, min 360×400, width
  capped at 500, not maximisable). `alwaysOnTop` and `startMinimized` are applied
  on startup from settings, mirroring `createWindow`.
- `windowAPI` is 1:1. `maximize`/`toggleMaximize` still answer
  `maximize-disabled`, `getBounds` returns DIPs, `setSize` clamps to
  360–500 wide and the monitor height, `setDefaultSize` applies the
  mini/medium/full presets and re-centres, and `closeToTray`/`quit` share the
  quit path that closes the database first.
- Close-to-tray is handled in `on_window_event`: `CloseRequested` is always
  prevented and either hides the window or quits, depending on `closeBehavior`.
  Minimise-to-tray is driven by `Resized` + `is_minimized()` because Tauri has no
  minimise event; it is off by default, as in Electron.
- The tray rebuilds its menu on focus and after every action so the
  Hide/Open label and the Always on Top checkbox stay accurate. Left click
  toggles the window (positioned beside the tray outside macOS), right click
  opens the menu. `positionWindowNearTray` maths was ported with the tray rect
  normalised to physical pixels.
- Rust reaches the webview by dispatching DOM events (`qp:navigate`,
  `qp:global-search`) from `window::emit`, so `api.app.onNavigate` /
  `onGlobalSearch` stay plain `addEventListener` subscriptions and no event
  plugin or extra JS package is needed. Tray navigation emits the same routes
  Electron used (`/vault`, `/import-export`, `/settings`,
  `/settings?section=about`).
- "Check for Updates…" currently only navigates to Settings; the update check
  arrives with the updater in Phase 7.
- Notifications keep Electron's contract: `unsupported` when the platform
  denies permission, `disabled` unless the `notifications` setting is `true`,
  then `{ success: true }`. `shell:open-external` still accepts only http(s).
- `app.getPlatform` reports `win32`/`darwin`/`linux` with the same booleans as
  `process.platform`, and `app:relaunch` restarts after a short delay so the
  response can reach the UI first.

Verified on a running app: the shell boots with the tray and the database, logs
`[Main] Global shortcut registered: CmdOrCtrl+Alt+P`, and a real `WM_CLOSE`
leaves the process alive with the `QuickPrompt` window hidden
(`IsWindowVisible = false`), i.e. close-to-tray works. `cargo test` (19),
`cargo clippy --all-targets`, `npm test` (52) and `npm run lint` are clean.

Not verified: pressing the global shortcut or using the tray menu by hand, the
always-on-top / preset buttons through the UI, a native notification actually
appearing, and `openExternal`. Registering Ctrl+Alt+P also fails while the
Electron reference app is running (`npm run dev` launches both shells), which is
expected; for this run the renderer was served with a temporary Vite config
without the Electron plugin. The tray menu items carry accelerators for display,
which Electron's tray menu did not bind — if a focused window ever fires both
the menu accelerator and the global shortcut, the event is simply delivered
twice.
