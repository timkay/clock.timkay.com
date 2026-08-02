# CLAUDE.md

## Project Overview

**clock.timkay.com** is a minimalist web-based analog/digital clock with a stopwatch. It renders a canvas-based analog clock face with overlaid digital time, day, and date text and is deployed as a static site at https://clock.timkay.com/.

## Repository Structure

```
.
├── index.html          # Main HTML entry point (canvas + pre element)
├── index.js            # Core clock logic (ES6 module): ClockFace class, update loop, event handling
├── style.css           # All styling: layout, clock face, circular border
├── jquery.js           # jQuery 3.3.1 (vendored, not from CDN)
├── icon.png            # Site icon
├── _headers            # Cloudflare Pages header config
├── webEdit.js          # Deprecated: asset display utility
├── weedit.js           # Deprecated: web editor integration (removed from HTML)
└── README.md           # Minimal project title
```

## Architecture

The site is a zero-build static site. The frontend files (`index.html`, `index.js`, `style.css`, `jquery.js`, etc.) are served directly with no transpilation, bundling, or minification.

### Entry Point Flow

1. `index.html` loads `style.css`, `jquery.js`, then `index.js` (as ES6 module)
2. `index.js` on DOM ready: calls `resize()` to create `ClockFace`, calls `update()`, starts `setInterval(update, 87)` loop, and calls `popout()`
3. `popout()` opens the named `clock` window from large top-level host tabs; the 300px popup size prevents recursion

### Key Components in index.js

- **`ClockFace` class** — Wraps a canvas element. Draws analog clock hands using trigonometry.
  - `v2s(x, y)` — Transforms model coordinates to screen coordinates (center-origin to top-left-origin)
  - `hand(z, len)` — Draws a single hand at fractional position `z` (0-1 range, 0.25 = 12 o'clock) with relative length `len`
  - `show(h, m, s)` — Clears canvas and draws all three hands (hour at 3/8, minute at 3/4, second at 95/100 length)
- **`resize()`** — Recalculates dimensions to keep the clock square, fitting the smaller of window width/height
- **`update()`** — Called every 87ms. Reads current time, updates analog hands via `face.show()`, formats digital display with day/date/time
- **`popout()`** — Opens the named minimal `clock` popup from a large host tab
- **Click handler** — Clicking the clock face toggles an elapsed-time stopwatch display

### Styling (style.css)

- Yellow background, red circular border (5px, `border-radius: 50%`)
- The `#clock` pre element is positioned absolutely and overlaid on the canvas
- The `#face` canvas is also absolutely positioned
- Square layout enforced by JS setting width/height to `min(windowWidth, windowHeight)`

## Code Conventions

### JavaScript

- jQuery is used for DOM selection and manipulation (`$()`, `.css()`, `.html()`, `.click()`)
- ES6 module syntax for `index.js` (`type="module"` in script tag)
- camelCase for variables and functions, PascalCase for classes
- Arrow functions for short callbacks, `function` declarations for named functions
- Destructuring assignment for array unpacking: `[this.w, this.h] = [w, w]`
- Template literals for string formatting
- No semicolons at end of lines is mixed — some lines have them, some don't. Follow the style of surrounding code when making changes.

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

### Deployment

The web version is deployed as static files to https://clock.timkay.com/ via Cloudflare Pages (auto-deploys from `main` branch). Push to a `claude/*` branch, the auto-merge workflow merges to main, and Cloudflare Pages deploys automatically.

### Testing

There are no automated tests. Verify changes visually by loading the page and confirming:
- Analog clock hands move correctly
- Digital time display updates every ~87ms
- Day and date display correctly
- Click-to-time stopwatch toggles on/off
- Layout stays square and responsive on window resize

## Live Update System

The website checks for deployed frontend updates while it is open.

### How it works

1. `index.js` checks `https://clock.timkay.com/version.json` every 30 seconds
2. If the version in `version.json` differs from the `#version` span in `index.html`, the page does `location.replace('https://clock.timkay.com/')` to reload from the live site
3. Open browser clocks reload when a new version is deployed

### Making a JS/CSS change

To deploy a frontend change that all running apps pick up automatically:

1. Edit the JS/CSS/HTML files
2. Bump the version in **both** `index.html` (`<span id="version">`) and `version.json` — they must match
3. Use the third version number for minor changes (e.g., `v0.2.5` → `v0.2.6`)
4. Commit and push to the `claude/*` session branch
5. The `auto-merge.yml` GitHub Action merges to main and deletes the branch
6. Cloudflare Pages deploys the updated site from main
7. Running apps detect the version mismatch within 1 second and reload

### Fast turnaround for changes

To minimize latency when deploying updates:

1. **Skip `git fetch`/`git reset`** — Don't sync with main before editing. The auto-merge handles it. Just edit files directly and push.
2. **Edit, bump version, commit, push** — That's the entire workflow. Four steps.
3. **Bump version in parallel** — Edit `index.html` and `version.json` together with the code changes, all in one commit.
4. **Single commit** — Combine all related changes into one commit to minimize push overhead.

The bottleneck is GitHub Actions (~10s to auto-merge) + Cloudflare Pages deploy, not local work.

### CI/CD Pipelines

- **`.github/workflows/auto-merge.yml`** — Triggered on push to `claude/**`. Merges the branch to main and deletes it.

## Important Details

- The update interval is **100ms** while the page is visible
- The clock uses the browser's local time
- `console.clear()` was removed (previously wiped dev console on every module load)
- Deprecated files (`webEdit.js`, `weedit.js`) remain in the repo but are not loaded

## Commit Style

Commit messages are short, lowercase, imperative or descriptive phrases:
- "get rid of weedit"
- "remove border"
- "get rid of quirks mode"
- "switch to video clock"
- "added icon.png"
