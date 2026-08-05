# Developer guide

Intent: help engineers preview tours locally, understand the Marzipano app structure, edit scene/hotspot data safely, and publish a new monthly tour without guessing.

## Architecture

Each `<month-yyyy>/` folder is a standalone Marzipano “multiple scenes” app generated from the Marzipano Tool, then checked into this repo.

```text
Browser
  └─ index.html
       ├─ vendor/marzipano.js   (viewer)
       ├─ vendor/bowser.min.js  (IE tooltip fallback)
       ├─ vendor/screenfull.min.js
       ├─ data.js               → window.APP_DATA
       └─ index.js              → creates Viewer, scenes, hotspots, controls
            └─ tiles/<scene-id>/{z}/{f}/{y}/{x}.jpg
```

Runtime flow (`index.js`):

1. Read `window.APP_DATA`.
2. Create `Marzipano.Viewer` on `#pano` with `settings.mouseViewMode`.
3. For each scene in `APP_DATA.scenes`, build:
   - `ImageUrlSource` from `tiles/<id>/{z}/{f}/{y}/{x}.jpg` (+ `preview.jpg`)
   - `CubeGeometry(levels)`
   - `RectilinearView` with `initialViewParameters` and a traditional FOV limiter
4. Attach **link hotspots** (scene switches) and **info hotspots** (title/text popovers).
5. Wire scene list, autorotate, fullscreen, and on-screen view controls.
6. Start on `scenes[0]`.

`index.js` and `style.css` are currently **byte-identical** across all month folders (enforced by `npm test`). Tour-specific content lives in `data.js`, `index.html` (scene list markup + `<title>`), and `tiles/`.

Repo-level helpers (not shipped to Pages browsers; used by Node tests):

| Path | Role |
|------|------|
| `lib/tour-integrity.js` | Discover month folders, evaluate `data.js`, validate package consistency |
| `lib/player-helpers.js` | Pure copies of player lookup/escape helpers for regression tests |
| `tests/*.test.js` | Integrity + helper suites (`node --test`) |
| `package.json` | `npm test` script; requires Node ≥ 18; no npm dependencies |

## Public interface: `APP_DATA` (`data.js`)

```js
var APP_DATA = {
  name: "june-2026",          // tour display name (also used as project title in tool export)
  settings: {
    mouseViewMode: "drag",    // "drag" | "qtvr" — passed to Viewer controls
    autorotateEnabled: true,  // initial autorotate toggle state
    fullscreenButton: true,   // hide fullscreen UI if false / unsupported
    viewControlButtons: true  // body gets class view-control-buttons from HTML
  },
  scenes: [ /* ... */ ]
};
```

`settings.mouseViewMode` must be `"drag"` or `"qtvr"` (Marzipano viewer modes). Integrity checks reject anything else.

### Scene object

| Field | Role |
|-------|------|
| `id` | Stable key. Must match folder `tiles/<id>/` and `data-id` in `index.html`. |
| `name` | Shown in title bar and link-hotspot tooltips. |
| `levels` | Cube LOD sizes for Marzipano (`tileSize`, `size`, optional `fallbackOnly`). |
| `faceSize` | Used by the view limiter. |
| `initialViewParameters` | `{ yaw, pitch, fov }` applied on scene enter. |
| `linkHotspots` | Navigation arrows: `{ yaw, pitch, rotation, target }`. `target` is another scene `id`. |
| `infoHotspots` | Info pins: `{ yaw, pitch, title, text }`. Currently unused (all tours ship `[]`). |

### Tile URL contract

From `index.js`:

```text
tiles/<scene.id>/{z}/{f}/{y}/{x}.jpg
tiles/<scene.id>/preview.jpg
```

`{f}` is a cube face (`f`, `b`, `l`, `r`, `u`, `d`). Level `0` is typically the fallback face; higher `{z}` values add resolution. Missing tiles show blank faces — validate IDs against folders before publishing.

### HTML contract

`index.html` must list every scene:

```html
<a href="javascript:void(0)" class="scene" data-id="0-lobby-1">
  <li class="text">Lobby 1</li>
</a>
```

`index.js` binds clicks with `querySelector('#sceneList .scene[data-id="..."]')`. A scene in `data.js` without a matching `data-id` will throw at startup.

Body classes used by CSS/JS:

- `multiple-scenes` / `view-control-buttons` — layout
- `desktop` / `mobile` — viewport ≤500px width or height
- `touch` / `no-touch` — after first touch
- `fullscreen-enabled` / `fullscreen-disabled`

## Local preview

```bash
python3 -m http.server 8080 --directory june-2026
# http://localhost:8080/
```

Constraints:

- **HTTP required.** `file://` breaks relative tile fetches in most browsers.
- Serve the **tour folder** (or the repo root and open `/<folder>/`). Paths in `index.js` are relative (`tiles/...`, `img/...`).
- Large tile trees (tens to hundreds of MB per month) — first load can be slow on cold cache.

## Workflow: add a new monthly tour

Prefer exporting a new tour from the [Marzipano Tool](https://www.marzipano.net/), then checking in the app files.

1. **Export** the tour (multi-scene) with link hotspots between spaces.
2. **Create** folder `YYYY-month` style used here, e.g. `july-2026/` (existing folders use `<month>-<yyyy>`).
3. **Copy** into the folder: `index.html`, `index.js`, `data.js`, `style.css`, `img/`, `vendor/`, `tiles/`.
4. **Rename for consistency**
   - Set `<title>` and `APP_DATA.name` to the folder label (e.g. `july-2026`).
   - Keep scene `id`s stable once published — hotspots and bookmarks depend on them.
5. **Verify**
   - Every `scenes[].id` has `tiles/<id>/` with `preview.jpg`.
   - Every scene has a matching `data-id` row in `index.html`.
   - Every `linkHotspots[].target` resolves to an existing scene id.
   - Folder name matches `<word>-<yyyy>` (e.g. `july-2026`) so `listTourDirectories` discovers it.
   - Run `npm test` from the repo root (see [Testing](#testing--tour-integrity)).
   - Local HTTP preview: scene list, hotspots, autorotate, fullscreen.
6. **Document** the new row in the root [README.md](../README.md) tour table.
7. **Deploy** by merging to `main` (GitHub Pages source: `main` `/`).

### Editing an existing tour without re-export

Safe manual edits:

- Scene display `name`s (keep `id` unless you also rename the tile folder + HTML `data-id` + hotspot targets).
- `initialViewParameters` (yaw/pitch/fov).
- `linkHotspots` yaw/pitch/rotation/target.
- `settings.*` flags.
- Adding `infoHotspots` with `title` / `text` (HTML is inserted as-is into the DOM — avoid untrusted content).

Risky / avoid casually:

- Changing `levels` or `faceSize` without regenerating tiles.
- Partial tile uploads (missing LODs).
- Diverging one folder’s `index.js` / `style.css` unless you intend a one-off fork — today they are shared copies.

## Testing / tour integrity

Intent: catch navigation data bugs (broken hotspot targets, HTML/`data.js` drift, missing tile folders, shared `index.js` forks) before publish. These checks mirror failure modes in `index.js` — e.g. `createLinkHotspotElement` does `findSceneDataById(hotspot.target).name`, which throws if `target` is unknown.

### Run

```bash
# from repo root — Node ≥ 18, no install step
npm test
```

Equivalent: `node --test tests/**/*.test.js`.

### What the suite covers

| Check | Source |
|-------|--------|
| Discovers all `<month>-<yyyy>` tour dirs | `listTourDirectories` (`^\w+-\d{4}$`) |
| `index.js` byte-identical across tours | SHA-256 compare in `tests/tour-integrity.test.js` |
| Per-tour package validation | `validateTourPackage` |
| Hotspot targets resolve | Asserted per tour + in validator |
| Player `sanitize` / scene lookup parity | `lib/player-helpers.js` vs `january-2026/index.js` |

### `validateTourPackage(tourDir)` contract

Returns `{ tourDir, errors, sceneCount? }`. Empty `errors` means the package is consistent enough for the player. It reports (non-exhaustive):

- Missing `data.js` / `index.html` / `index.js`
- Invalid or empty `APP_DATA.scenes` / `settings`
- Duplicate or empty scene ids; missing `name`, `faceSize`, `levels`, `initialViewParameters`
- Missing `tiles/<id>/` or `preview.jpg`
- Link hotspot non-numeric yaw/pitch/rotation or unknown `target`
- Info hotspot non-numeric yaw/pitch or non-string `title`/`text`
- `index.html` `#sceneList` `data-id` values missing, unknown, or duplicated

Example (programmatic):

```js
const path = require('path');
const { validateTourPackage, listTourDirectories } = require('./lib/tour-integrity');

for (const tour of listTourDirectories(__dirname)) {
  const { errors } = validateTourPackage(path.join(__dirname, tour));
  if (errors.length) console.error(tour, errors);
}
```

### Player helpers (`lib/player-helpers.js`)

Exported for tests only; behavior matches the inlined functions in each tour’s `index.js`:

| Helper | Behavior / constraint |
|--------|------------------------|
| `sanitize(s)` | Escapes **first** `&`, `<`, `>` only (Marzipano-generated quirk — not a full HTML escaper) |
| `findSceneDataById(list, id)` | Linear search on `APP_DATA.scenes`; returns `null` if missing |
| `findSceneById(scenes, id)` | Linear search on wrapped `{ data, scene }` objects used by `switchScene` |

Do not “fix” `sanitize` in `lib/` alone — change the player `index.js` copies together (or accept the drift test failing until both match).

## Deployment / operations

| Item | Value |
|------|--------|
| Host | GitHub Pages |
| Source | `main`, site root `/` |
| Public URL | `https://jacobelzey.github.io/graceway-phase2-tours/<folder>/` |
| Custom domain | Previously `tours.elzey.pw` via root `CNAME`; file removed — DNS/Pages custom domain may need separate cleanup if still configured outside the repo |

No CI or bundler. `package.json` exists only for the local `npm test` entrypoint (zero dependencies). A Pages build publishes the static tree as-is; `lib/` and `tests/` are unused by the browser tours.

Operational checks after publish:

1. Open the new folder URL in a desktop browser and a phone-width viewport.
2. Confirm the first scene loads (not blank) — usually a tile path / ID mismatch if blank.
3. Click several link hotspots and every scene list entry.
4. Toggle autorotate and fullscreen.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Black / empty pano | Opened via `file://`, wrong base path, or missing `tiles/<id>/` | Use HTTP; confirm tile folders match scene ids |
| `Cannot read properties of null` on load | Scene in `data.js` missing from `#sceneList` | Add `data-id` entry in `index.html` |
| Hotspot click does nothing / error | `target` id typo | Align with `scenes[].id` |
| Fullscreen button missing | `screenfull` unsupported or `fullscreenButton: false` | Expected on some browsers; check `settings` |
| Autorotate won’t start | Toggle not `.enabled` | Click play control, or set `autorotateEnabled: true` and reload |
| IE tooltip oddities | `bowser` IE &lt; 11 path | Body gets `tooltip-fallback`; modern browsers ignore |
| Huge clone / PR | Tile binaries dominate | Keep month folders self-contained; don’t duplicate vendor unnecessarily across unrelated experiments |

## Common pitfalls

- **Stock Marzipano README** in `january-2026/README.txt` points at the developer guide (older Marzipano exports used an `app-files/` wrapper this repo does **not** use — tour files live at the folder root).
- **Scene list vs data drift** — regenerating only `data.js` without updating `index.html` (or vice versa) breaks startup; `npm test` catches this.
- **Broken link targets** — unknown `target` ids crash hotspot creation (`findSceneDataById(...).name`), not merely skip navigation.
- **ID renames** — May vs June reused human labels (Lobby 1, …) but different id strings and ordering; copy-pasting hotspots across months without remapping targets will mis-route.
- **Folder naming** — only directories matching `\w+-\d{4}` (e.g. `july-2026`) are discovered by tests. `april-2026` is absent today; adding it requires that naming shape.
- **`APP_DATA.name` defaults** — older exports still say tool placeholders (`Graceway-Construction-December`, `Project Title`); newer months use the folder label. Prefer aligning `name` + `<title>` with the folder when exporting.
- **Info hotspots** — supported by `index.js` but unused in current exports; `text`/`title` are assigned with `innerHTML`.
- **`.DS_Store`** — macOS metadata has been committed before; prefer omitting it from new tours.
