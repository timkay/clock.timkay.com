use tauri_plugin_updater::UpdaterExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_updater::Builder::new().build())
    .on_window_event(|window, event| {
      if let tauri::WindowEvent::Resized(size) = event {
        if size.width != size.height && size.width > 0 && size.height > 0 {
          let s = std::cmp::max(size.width, size.height);
          let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize::new(s, s)));
        }
      }
    })
    .setup(|app| {
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
