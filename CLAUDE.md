# CLAUDE.md

## Project Overview

**clock.timkay.com** is a minimalist analog/digital clock Progressive Web App (PWA). It renders a canvas-based analog clock face with overlaid digital time, day, and date text. The site is deployed as a static site at https://clock.timkay.com/.

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
├── main.js             # Electron desktop wrapper (frameless, transparent, always-on-top)
├── _headers            # Netlify header config (Content-Type for manifest.json)
├── webEdit.js          # Deprecated: asset display utility
├── weedit.js           # Deprecated: web editor integration (removed from HTML)
└── README.md           # Minimal project title
```

## Architecture

### No Build System

This is a zero-build static site. All files are served directly with no transpilation, bundling, or minification. There is no `package.json`, no npm dependencies, and no build scripts.

### Entry Point Flow

1. `index.html` loads `style.css`, `jquery.js`, then `index.js` (as ES6 module)
2. `index.js` on DOM ready: calls `resize()` to create `ClockFace`, calls `update()`, starts `setInterval(update, 87)` loop, and calls `popout()`
3. Service worker is registered for PWA support but does no caching

### Key Components in index.js

- **`ClockFace` class** — Wraps a canvas element. Draws analog clock hands using trigonometry.
  - `v2s(x, y)` — Transforms model coordinates to screen coordinates (center-origin to top-left-origin)
  - `hand(z, len)` — Draws a single hand at fractional position `z` (0-1 range, 0.25 = 12 o'clock) with relative length `len`
  - `show(h, m, s)` — Clears canvas and draws all three hands (hour at 3/8, minute at 3/4, second at 95/100 length)
- **`resize()`** — Recalculates dimensions to keep the clock square, fitting the smaller of window width/height
- **`update()`** — Called every 87ms. Reads current time, updates analog hands via `face.show()`, formats digital display with day/date/time
- **`popout()`** — Opens a small popup window if the page is viewed in a large browser window directly
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

### Electron Support (main.js)

Optional desktop wrapper using Electron. Creates a 250x250 frameless, transparent, always-on-top window. Uses CommonJS (`require`). Not part of the web deployment.

## Code Conventions

### JavaScript

- jQuery is used for DOM selection and manipulation (`$()`, `.css()`, `.html()`, `.click()`)
- ES6 module syntax for `index.js` (`type="module"` in script tag)
- camelCase for variables and functions, PascalCase for classes
- Arrow functions for short callbacks, `function` declarations for named functions
- Destructuring assignment for array unpacking: `[this.w, this.h] = [w, w]`
- Template literals for string formatting
- No semicolons at end of lines is mixed — some lines have them, some don't. The codebase is inconsistent; follow the style of surrounding code when making changes.

### CSS

- Simple, flat selectors (element, ID)
- No CSS preprocessor or framework
- Box-sizing border-box used on positioned elements

### HTML

- `<!DOCTYPE html>` with `lang="en"`
- Minimal markup: just a canvas and a pre element
- Commented-out elements remain in the file (grab handle, weedit script)

## Development Workflow

### Local Development

Serve the directory with any static file server:

```sh
python3 -m http.server 8000
# or
npx serve .
```

Open `http://localhost:8000` in a browser.

### Deployment

The site is deployed as static files to https://clock.timkay.com/ (likely via Netlify given the `_headers` file). Push to the appropriate branch and deploy.

### Testing

There are no automated tests. Verify changes visually by loading the page and confirming:
- Analog clock hands move correctly
- Digital time display updates every ~87ms
- Day and date display correctly
- Click-to-time stopwatch toggles on/off
- Layout stays square and responsive on window resize

## Important Details

- The update interval is **87ms** — chosen to balance smooth hand movement against CPU usage
- Time conversion uses string comparison (`time > '12'`) for AM/PM logic, not numeric comparison
- The clock defaults to **local time** (the `utc` const is hardcoded to `false`)
- `console.clear()` is called at the top of `index.js` on every module load
- Deprecated files (`webEdit.js`, `weedit.js`) remain in the repo but are not loaded

## Commit Style

Commit messages are short, lowercase, imperative or descriptive phrases:
- "get rid of weedit"
- "remove border"
- "get rid of quirks mode"
- "switch to video clock"
- "added icon.png"
