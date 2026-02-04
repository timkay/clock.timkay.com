# CLAUDE.md

## Project Overview

**clock.timkay.com** is a minimalist analog/digital clock Progressive Web App (PWA) with a Tauri desktop wrapper. It renders a canvas-based analog clock face with overlaid digital time, day, and date text. The web version is deployed as a static site at https://clock.timkay.com/. The Tauri build produces a native desktop app with always-on-top, frameless, transparent window.

## Repository Structure

```
.
├── index.html          # Main HTML entry point (canvas + pre element)
├── index.js            # Core clock logic (ES6 module): ClockFace class, update loop, event handling
├── style.css           # All styling: layout, clock face, circular border
├── jquery.js           # jQuery 3.3.1 (vendored, not from CDN)
├── manifest.json       # PWA manifest (standalone display, yellow/red theme)
├── serviceworker.js    # Minimal service worker (install/activate, no caching strategy)
├── icon.png            # 192x192 PWA icon
├── _headers            # Netlify header config (Content-Type for manifest.json)
├── package.json        # npm config (Tauri CLI dev dependency, `tauri` script)
├── src-tauri/          # Tauri desktop app
│   ├── tauri.conf.json # Tauri config (window, build, bundle settings)
│   ├── Cargo.toml      # Rust dependencies (tauri, tauri-plugin-log)
│   ├── src/
│   │   ├── main.rs     # Binary entry point (calls clock_lib::run)
│   │   └── lib.rs      # Tauri app setup (Builder, plugins)
│   ├── build.rs        # Tauri build script
│   ├── capabilities/   # Tauri permission capabilities
│   └── icons/          # App icons for bundling (icns, ico, png)
├── webEdit.js          # Deprecated: asset display utility
├── weedit.js           # Deprecated: web editor integration (removed from HTML)
└── README.md           # Minimal project title
```

## Architecture

### Web (Static Site)

The web version is a zero-build static site. The frontend files (`index.html`, `index.js`, `style.css`, `jquery.js`, etc.) are served directly with no transpilation, bundling, or minification.

### Tauri (Desktop App)

The Tauri wrapper in `src-tauri/` builds a native desktop application. The `beforeBuildCommand` copies web assets into a `dist/` directory (excluded from git) which Tauri embeds into the binary.

**Window configuration** (`src-tauri/tauri.conf.json`):
- 250x250, frameless (`decorations: false`), transparent, always-on-top
- Resizable

**Platform webviews**: WebKitGTK on Linux, WebView2 (Edge) on Windows, WKWebView on macOS.

### Entry Point Flow

1. `index.html` loads `style.css`, `jquery.js`, then `index.js` (as ES6 module)
2. `index.js` on DOM ready: calls `resize()` to create `ClockFace`, calls `update()`, starts `setInterval(update, 87)` loop, and calls `popout()`
3. `popout()` is skipped when running inside Tauri (checks `window.__TAURI_INTERNALS__`)
4. Service worker is registered for PWA support but does no caching

### Key Components in index.js

- **`ClockFace` class** — Wraps a canvas element. Draws analog clock hands using trigonometry.
  - `v2s(x, y)` — Transforms model coordinates to screen coordinates (center-origin to top-left-origin)
  - `hand(z, len)` — Draws a single hand at fractional position `z` (0-1 range, 0.25 = 12 o'clock) with relative length `len`
  - `show(h, m, s)` — Clears canvas and draws all three hands (hour at 3/8, minute at 3/4, second at 95/100 length)
- **`resize()`** — Recalculates dimensions to keep the clock square, fitting the smaller of window width/height
- **`update()`** — Called every 87ms. Reads current time, updates analog hands via `face.show()`, formats digital display with day/date/time
- **`popout()`** — Opens a small popup window if viewed in a large browser window (disabled in Tauri)
- **Click handler** — Clicking the clock face toggles an elapsed-time stopwatch display

### Styling (style.css)

- Yellow background, red circular border (5px, `border-radius: 50%`)
- The `#clock` pre element is positioned absolutely and overlaid on the canvas
- The `#face` canvas is also absolutely positioned
- Square layout enforced by JS setting width/height to `min(windowWidth, windowHeight)`

### PWA Configuration

- `manifest.json`: standalone display, yellow background, red theme, 192x192 icon
- `serviceworker.js`: registers install/activate but passes all fetches to network (no offline caching)
- `_headers`: Netlify config setting `Content-Type: application/manifest+json` for manifest

## Code Conventions

### JavaScript

- jQuery is used for DOM selection and manipulation (`$()`, `.css()`, `.html()`, `.click()`)
- ES6 module syntax for `index.js` (`type="module"` in script tag)
- camelCase for variables and functions, PascalCase for classes
- Arrow functions for short callbacks, `function` declarations for named functions
- Destructuring assignment for array unpacking: `[this.w, this.h] = [w, w]`
- Template literals for string formatting
- No semicolons at end of lines is mixed — some lines have them, some don't. Follow the style of surrounding code when making changes.

### Rust (src-tauri)

- Standard Tauri v2 boilerplate. Minimal custom Rust code.
- Crate name: `clock`, lib name: `clock_lib`

### CSS

- Simple, flat selectors (element, ID)
- No CSS preprocessor or framework
- Box-sizing border-box used on positioned elements

### HTML

- `<!DOCTYPE html>` with `lang="en"`
- Minimal markup: just a canvas and a pre element
- Commented-out elements remain in the file (grab handle, weedit script)

## Development Workflow

### Local Web Development

Serve the directory with any static file server:

```sh
python3 -m http.server 8000
# or
npx serve .
```

Open `http://localhost:8000` in a browser.

### Tauri Development

```sh
npm run tauri dev       # Dev mode with hot reload (requires local server on port 8000)
npm run tauri build     # Release build (copies assets to dist/, compiles Rust, produces bundles)
```

**Linux system dependencies** (required for build):
```sh
apt-get install -y libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libsoup-3.0-dev libjavascriptcoregtk-4.1-dev
```

**Build outputs** (in `src-tauri/target/release/bundle/`):
- `.deb` (Debian/Ubuntu)
- `.rpm` (Fedora/RHEL)
- `.AppImage` (portable Linux)
- `.msi`/`.exe` (Windows, when built on Windows)
- `.dmg`/`.app` (macOS, when built on macOS)

### Deployment

The web version is deployed as static files to https://clock.timkay.com/ (via Netlify, per the `_headers` file). Push to the appropriate branch and deploy.

### Testing

There are no automated tests. Verify changes visually by loading the page and confirming:
- Analog clock hands move correctly
- Digital time display updates every ~87ms
- Day and date display correctly
- Click-to-time stopwatch toggles on/off
- Layout stays square and responsive on window resize
- For Tauri: window is frameless, transparent, and stays on top

## Live Update System

The Tauri desktop app and the website both support live JS/CSS updates without rebuilding the binary.

### How it works

1. `index.js` checks `https://clock.timkay.com/version.json` every 1 second
2. If the version in `version.json` differs from the `#version` span in `index.html`, the page does `location.replace('https://clock.timkay.com/')` to reload from the live site
3. This works in all contexts: Tauri (local files), Tauri (after redirect to website), and browser

### Making a JS/CSS change

To deploy a frontend change that all running apps pick up automatically:

1. Edit the JS/CSS/HTML files
2. Bump the version in **both** `index.html` (`<span id="version">`) and `version.json` — they must match
3. Use the third version number for minor changes (e.g., `v0.2.5` → `v0.2.6`)
4. Commit and push to the `claude/*` session branch
5. The `auto-merge.yml` GitHub Action merges to main and deletes the branch
6. Netlify deploys the updated site from main
7. Running apps detect the version mismatch within 1 second and reload

No binary rebuild is needed for JS/CSS/HTML-only changes. Only rebuild the binary when changing Rust code in `src-tauri/` or Tauri config.

### Fast turnaround for changes

To minimize latency when deploying updates:

1. **Skip `git fetch`/`git reset`** — Don't sync with main before editing. The auto-merge handles it. Just edit files directly and push.
2. **Edit, bump version, commit, push** — That's the entire workflow. Four steps.
3. **Bump version in parallel** — Edit `index.html` and `version.json` together with the code changes, all in one commit.
4. **Single commit** — Combine all related changes into one commit to minimize push overhead.

The bottleneck is GitHub Actions (~10s to auto-merge) + Netlify deploy, not local work.

### CI/CD Pipelines

- **`.github/workflows/auto-merge.yml`** — Triggered on push to `claude/**`. Merges the branch to main and deletes it.
- **`.github/workflows/release.yml`** — Triggered on push to `main` or `v*` tags. Builds Tauri binaries for Linux, macOS, and Windows. Creates a GitHub Release with `latest.json` for the Tauri auto-updater.

### Binary auto-updater

The Tauri binary checks for updates via `tauri-plugin-updater` every 30 seconds (configured in `src-tauri/src/lib.rs`). The updater endpoint points to GitHub Releases (`latest.json`). This is separate from the JS live update — it handles Rust/Tauri binary updates.

## Important Details

- The update interval is **87ms** — chosen to balance smooth hand movement against CPU usage
- Time conversion uses string comparison (`time > '12'`) for AM/PM logic, not numeric comparison
- The clock defaults to **local time** (the `utc` const is hardcoded to `false`)
- `console.clear()` is called at the top of `index.js` on every module load
- Deprecated files (`webEdit.js`, `weedit.js`) remain in the repo but are not loaded
- The `dist/` directory is a build artifact (gitignored) — web assets are copied there by the Tauri build command
- `node_modules/` is gitignored

## Commit Style

Commit messages are short, lowercase, imperative or descriptive phrases:
- "get rid of weedit"
- "remove border"
- "get rid of quirks mode"
- "switch to video clock"
- "added icon.png"
