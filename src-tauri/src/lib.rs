use tauri_plugin_updater::UpdaterExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_updater::Builder::new().build())
    .on_window_event(|window, event| {
      match event {
        tauri::WindowEvent::Resized(size) => {
          if !window.is_maximized().unwrap_or(false) &&
             size.width != size.height && size.width > 0 && size.height > 0 {
            let s = std::cmp::max(size.width, size.height);
            let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize::new(s, s)));
          }
        }
        tauri::WindowEvent::Moved(_) => {
          if window.is_maximized().unwrap_or(false) {
            let _ = window.unmaximize();
          }
        }
        _ => {}
      }
    })
    .setup(|app| {
      // Position window in upper right corner
      if let Some(window) = app.get_webview_window("main") {
        if let Ok(size) = window.outer_size() {
          if let Some(monitor) = window.current_monitor().ok().flatten() {
            let screen = monitor.size();
            let x = screen.width as i32 - size.width as i32 - 10;
            let y = 10;
            let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(x, y)));
          }
        }
      }

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      let handle = app.handle().clone();
      std::thread::spawn(move || {
        loop {
          std::thread::sleep(std::time::Duration::from_secs(30));
          tauri::async_runtime::block_on(async {
            if let Ok(updater) = handle.updater_builder().build() {
              if let Ok(Some(update)) = updater.check().await {
                let _ = update.download_and_install(|_, _| {}, || {}).await;
              }
            }
          });
        }
      });
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
