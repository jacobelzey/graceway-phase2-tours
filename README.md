# Graceway Phase 2 — 360° Tours

Static [Marzipano](https://www.marzipano.net/) multi-scene 360° tours that document Graceway Phase 2 construction progress by month.

Each month is a self-contained tour folder. There is no build step: a static file server is enough to preview or deploy.

## Live tours

Hosted via GitHub Pages from `main`:

| Tour | Path | Scenes | Notes |
|------|------|--------|-------|
| January 2026 | [`january-2026/`](january-2026/) | 11 | Early construction / entrance + auditorium focus |
| February 2026 | [`february-2026/`](february-2026/) | 13 | Lobby, nurseries, conference rooms, classrooms |
| March 2026 | [`march-2026/`](march-2026/) | 15 | Expanded nursery coverage |
| May 2026 | [`may-2026/`](may-2026/) | 15 | Renamed scene IDs; meeting / sound rooms |
| June 2026 | [`june-2026/`](june-2026/) | 15 | Latest layout; nursery scenes ordered before meeting rooms |

Browse a tour at:

```text
https://jacobelzey.github.io/graceway-phase2-tours/<folder>/
```

Example: `https://jacobelzey.github.io/graceway-phase2-tours/june-2026/`

> A previous custom domain (`tours.elzey.pw`) was removed from the repo (`CNAME` deleted). Pages currently serve from the `github.io` URL above.

## Quick start (local)

Do not open `index.html` via `file://` — browsers block tile loading that way.

```bash
# from repo root — serve any tour folder
python3 -m http.server 8080 --directory june-2026
# then open http://localhost:8080/
```

Or serve the whole repo and navigate to a folder:

```bash
python3 -m http.server 8080
# http://localhost:8080/june-2026/
```

## Repo layout

```text
<month-yyyy>/
  index.html    # scene list UI shell
  index.js      # Marzipano viewer bootstrap (identical across tours today)
  data.js       # APP_DATA: scenes, hotspots, viewer settings
  style.css     # tour chrome styles (identical across tours today)
  tiles/        # cubemap tile pyramid per scene id
  img/          # UI icons (link, info, fullscreen, etc.)
  vendor/       # marzipano.js, bowser, screenfull, reset CSS

lib/            # Node helpers for integrity checks (not used by the browser)
tests/          # node:test suites — run with npm test
package.json    # test script only (no dependencies)
```

See [docs/developer-guide.md](docs/developer-guide.md) for architecture, `APP_DATA` fields, integrity checks, how to add a month, and troubleshooting.

## Verify before publishing

```bash
npm test   # Node ≥ 18; no npm install required
```

Checks scene/hotspot/HTML/tile consistency and that shared `index.js` has not drifted across month folders.

## Documentation

- [Developer guide](docs/developer-guide.md) — architecture, workflows, testing, pitfalls
- `january-2026/README.txt` — short per-folder pointer to the docs above
