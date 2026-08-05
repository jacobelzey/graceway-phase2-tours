'use strict';

const fs = require('fs');
const path = require('path');

const TOUR_DIR_PATTERN = /^\w+-\d{4}$/;
const VALID_MOUSE_VIEW_MODES = new Set(['drag', 'qtvr']);
// Cube faces requested by Marzipano ImageUrlSource.fromString("{z}/{f}/{y}/{x}.jpg").
const CUBE_FACES = ['f', 'b', 'l', 'r', 'u', 'd'];

// Scripts/stylesheets loaded by index.html — missing any of these hard-fails boot.
const REQUIRED_VENDOR_FILES = [
  'vendor/marzipano.js',
  'vendor/bowser.min.js',
  'vendor/screenfull.min.js',
  'vendor/reset.min.css'
];

// Chrome icons referenced by index.html and/or createLinkHotspotElement /
// createInfoHotspotElement in the shared player. Missing link.png blanks every
// navigation hotspot; missing control icons breaks autorotate/fullscreen/view UI.
const REQUIRED_IMG_FILES = [
  'img/link.png',
  'img/info.png',
  'img/close.png',
  'img/play.png',
  'img/pause.png',
  'img/fullscreen.png',
  'img/windowed.png',
  'img/expand.png',
  'img/collapse.png',
  'img/up.png',
  'img/down.png',
  'img/left.png',
  'img/right.png',
  'img/plus.png',
  'img/minus.png'
];

// DOM ids queried at startup by the shared index.js. A missing #pano (etc.)
// throws before any scene can render.
const REQUIRED_HTML_ELEMENT_IDS = [
  'pano',
  'titleBar',
  'sceneList',
  'sceneListToggle',
  'autorotateToggle',
  'fullscreenToggle',
  'viewUp',
  'viewDown',
  'viewLeft',
  'viewRight',
  'viewIn',
  'viewOut'
];

function listTourDirectories(repoRoot) {
  return fs
    .readdirSync(repoRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && TOUR_DIR_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

function loadAppData(tourDir) {
  const dataPath = path.join(tourDir, 'data.js');
  const source = fs.readFileSync(dataPath, 'utf8');
  // data.js assigns APP_DATA in browser scope; evaluate in an isolated function.
  return new Function(`${source}; return APP_DATA;`)();
}

function extractHtmlSceneIds(html) {
  // Scene list entries are <a class="scene" data-id="..."> in generated index.html.
  // Attribute order varies across Marzipano exports, so inspect the full attribute string.
  return [...html.matchAll(/<a\b([^>]*)>/g)]
    .map((match) => match[1])
    .filter((attrs) => /\bclass=(["'])[^"']*\bscene\b[^"']*\1/.test(attrs))
    .map((attrs) => {
      const idMatch = attrs.match(/\bdata-id=(["'])([^"']*)\1/);
      return idMatch ? idMatch[2] : null;
    })
    .filter((id) => typeof id === 'string' && id.length > 0);
}

function missingRequiredFiles(tourDir, relativePaths) {
  return relativePaths.filter((relativePath) => !fs.existsSync(path.join(tourDir, relativePath)));
}

function missingRequiredHtmlElementIds(html) {
  return REQUIRED_HTML_ELEMENT_IDS.filter((id) => {
    const pattern = new RegExp(`\\bid=["']${id}["']`);
    return !pattern.test(html);
  });
}

/**
 * Settings flags that enable chrome must have matching markup, otherwise
 * index.js still queries the nodes (view controls) or leaves dead toggles.
 */
function settingsChromeMismatches(settings, html) {
  const mismatches = [];
  if (!settings || typeof settings !== 'object') {
    return mismatches;
  }
  if (settings.fullscreenButton && !/\bid=["']fullscreenToggle["']/.test(html)) {
    mismatches.push('settings.fullscreenButton is true but index.html lacks #fullscreenToggle');
  }
  if (settings.autorotateEnabled && !/\bid=["']autorotateToggle["']/.test(html)) {
    mismatches.push('settings.autorotateEnabled is true but index.html lacks #autorotateToggle');
  }
  if (settings.viewControlButtons) {
    for (const id of ['viewUp', 'viewDown', 'viewLeft', 'viewRight', 'viewIn', 'viewOut']) {
      if (!new RegExp(`\\bid=["']${id}["']`).test(html)) {
        mismatches.push(`settings.viewControlButtons is true but index.html lacks #${id}`);
      }
    }
  }
  return mismatches;
}

function tilesPerSide(level) {
  if (!level || !Number.isFinite(level.size) || !Number.isFinite(level.tileSize) || level.tileSize <= 0) {
    return null;
  }
  return Math.ceil(level.size / level.tileSize);
}

/**
 * Ensure every non-fallback LOD has the full cubemap grid on disk.
 * Missing tiles render as blank faces at runtime.
 */
function missingCubeTiles(tourDir, scene) {
  const missing = [];
  if (!scene || typeof scene.id !== 'string' || !Array.isArray(scene.levels)) {
    return missing;
  }

  for (const [z, level] of scene.levels.entries()) {
    if (!level || level.fallbackOnly) {
      continue;
    }
    const side = tilesPerSide(level);
    if (side === null) {
      missing.push(`${scene.id} levels[${z}] has invalid size/tileSize`);
      continue;
    }
    for (const face of CUBE_FACES) {
      for (let y = 0; y < side; y += 1) {
        for (let x = 0; x < side; x += 1) {
          const tilePath = path.join(
            tourDir,
            'tiles',
            scene.id,
            String(z),
            face,
            String(y),
            `${x}.jpg`
          );
          if (!fs.existsSync(tilePath)) {
            missing.push(`${scene.id}/${z}/${face}/${y}/${x}.jpg`);
          }
        }
      }
    }
  }
  return missing;
}

/**
 * Scenes reachable from startId by following linkHotspots[].target edges.
 * Orphaned scenes remain openable from the HTML scene list, but hotspot navigation
 * is the primary in-panorama path — regressions here strand visitors mid-tour.
 */
function reachableSceneIds(scenes, startId) {
  const byId = new Map();
  for (const scene of scenes || []) {
    if (scene && typeof scene.id === 'string') {
      byId.set(scene.id, scene);
    }
  }
  if (!byId.has(startId)) {
    return new Set();
  }

  const seen = new Set([startId]);
  const queue = [startId];
  while (queue.length) {
    const current = queue.shift();
    const scene = byId.get(current);
    for (const hotspot of scene.linkHotspots || []) {
      const target = hotspot && hotspot.target;
      if (typeof target === 'string' && byId.has(target) && !seen.has(target)) {
        seen.add(target);
        queue.push(target);
      }
    }
  }
  return seen;
}

function validateTourPackage(tourDir) {
  const errors = [];
  const dataPath = path.join(tourDir, 'data.js');
  const htmlPath = path.join(tourDir, 'index.html');
  const indexJsPath = path.join(tourDir, 'index.js');
  const styleCssPath = path.join(tourDir, 'style.css');

  for (const required of [dataPath, htmlPath, indexJsPath, styleCssPath]) {
    if (!fs.existsSync(required)) {
      errors.push(`missing required file: ${path.basename(required)}`);
    }
  }
  for (const relativePath of missingRequiredFiles(tourDir, REQUIRED_VENDOR_FILES)) {
    errors.push(`missing required vendor asset: ${relativePath}`);
  }
  for (const relativePath of missingRequiredFiles(tourDir, REQUIRED_IMG_FILES)) {
    errors.push(`missing required img asset: ${relativePath}`);
  }
  // Core boot files are required to continue; packaging gaps still surface above.
  if (!fs.existsSync(dataPath) || !fs.existsSync(htmlPath) || !fs.existsSync(indexJsPath)) {
    return { tourDir, errors };
  }

  let appData;
  try {
    appData = loadAppData(tourDir);
  } catch (err) {
    return { tourDir, errors: [...errors, `data.js failed to evaluate: ${err.message}`] };
  }

  if (!appData || typeof appData !== 'object') {
    errors.push('APP_DATA must be an object');
    return { tourDir, errors };
  }

  if (!Array.isArray(appData.scenes) || appData.scenes.length === 0) {
    errors.push('APP_DATA.scenes must be a non-empty array');
  }

  if (!appData.settings || typeof appData.settings !== 'object') {
    errors.push('APP_DATA.settings must be an object');
  } else if (!VALID_MOUSE_VIEW_MODES.has(appData.settings.mouseViewMode)) {
    errors.push(
      `settings.mouseViewMode must be one of ${[...VALID_MOUSE_VIEW_MODES].join(', ')}; got ${JSON.stringify(appData.settings.mouseViewMode)}`
    );
  }

  const scenes = Array.isArray(appData.scenes) ? appData.scenes : [];
  const sceneIds = scenes.map((scene) => scene && scene.id);
  const uniqueIds = new Set(sceneIds);

  if (uniqueIds.size !== sceneIds.length) {
    errors.push('scene ids must be unique');
  }

  for (const scene of scenes) {
    if (!scene || typeof scene !== 'object') {
      errors.push('scene entry must be an object');
      continue;
    }
    if (typeof scene.id !== 'string' || !scene.id) {
      errors.push('scene.id must be a non-empty string');
    }
    if (typeof scene.name !== 'string' || !scene.name) {
      errors.push(`scene ${scene.id || '<unknown>'} is missing name`);
    }
    if (!Number.isFinite(scene.faceSize) || scene.faceSize <= 0) {
      errors.push(`scene ${scene.id} faceSize must be a positive number`);
    }
    if (!scene.initialViewParameters || typeof scene.initialViewParameters !== 'object') {
      errors.push(`scene ${scene.id} is missing initialViewParameters`);
    } else {
      for (const key of ['pitch', 'yaw', 'fov']) {
        if (!Number.isFinite(scene.initialViewParameters[key])) {
          errors.push(`scene ${scene.id} initialViewParameters.${key} must be a finite number`);
        }
      }
    }
    if (!Array.isArray(scene.levels) || scene.levels.length === 0) {
      errors.push(`scene ${scene.id} levels must be a non-empty array`);
    } else {
      for (const [index, level] of scene.levels.entries()) {
        if (!Number.isFinite(level.tileSize) || !Number.isFinite(level.size)) {
          errors.push(`scene ${scene.id} levels[${index}] requires numeric tileSize and size`);
        }
      }
    }
    if (!Array.isArray(scene.linkHotspots)) {
      errors.push(`scene ${scene.id} linkHotspots must be an array`);
    }
    if (!Array.isArray(scene.infoHotspots)) {
      errors.push(`scene ${scene.id} infoHotspots must be an array`);
    }

    const tileDir = path.join(tourDir, 'tiles', scene.id);
    if (!fs.existsSync(tileDir)) {
      errors.push(`missing tile directory for scene ${scene.id}`);
    } else if (!fs.existsSync(path.join(tileDir, 'preview.jpg'))) {
      errors.push(`missing preview.jpg for scene ${scene.id}`);
    } else {
      const missingTiles = missingCubeTiles(tourDir, scene);
      // Cap reported paths so a wiped LOD does not drown other integrity errors.
      for (const tile of missingTiles.slice(0, 8)) {
        errors.push(`missing cube tile ${tile}`);
      }
      if (missingTiles.length > 8) {
        errors.push(
          `scene ${scene.id} missing ${missingTiles.length - 8} additional cube tiles`
        );
      }
    }

    for (const hotspot of scene.linkHotspots || []) {
      if (!Number.isFinite(hotspot.yaw) || !Number.isFinite(hotspot.pitch) || !Number.isFinite(hotspot.rotation)) {
        errors.push(`scene ${scene.id} has a link hotspot with non-numeric yaw/pitch/rotation`);
      }
      if (typeof hotspot.target !== 'string' || !hotspot.target) {
        errors.push(`scene ${scene.id} has a link hotspot with an invalid target`);
      } else if (!uniqueIds.has(hotspot.target)) {
        // Broken targets crash createLinkHotspotElement via findSceneDataById(...).name
        errors.push(`scene ${scene.id} link hotspot targets unknown scene "${hotspot.target}"`);
      }
    }

    for (const hotspot of scene.infoHotspots || []) {
      if (!Number.isFinite(hotspot.yaw) || !Number.isFinite(hotspot.pitch)) {
        errors.push(`scene ${scene.id} has an info hotspot with non-numeric yaw/pitch`);
      }
      if (typeof hotspot.title !== 'string' || typeof hotspot.text !== 'string') {
        errors.push(`scene ${scene.id} info hotspot requires string title and text`);
      }
    }
  }

  if (!fs.existsSync(htmlPath)) {
    return { tourDir, errors, sceneCount: scenes.length };
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  for (const id of missingRequiredHtmlElementIds(html)) {
    errors.push(`index.html is missing required element id="${id}"`);
  }
  for (const mismatch of settingsChromeMismatches(appData.settings, html)) {
    errors.push(mismatch);
  }

  const htmlSceneIds = extractHtmlSceneIds(html);
  const htmlSet = new Set(htmlSceneIds);

  if (htmlSceneIds.length !== htmlSet.size) {
    errors.push('index.html scene list contains duplicate data-id values');
  }
  for (const id of sceneIds) {
    if (typeof id === 'string' && !htmlSet.has(id)) {
      errors.push(`index.html is missing scene list entry for "${id}"`);
    }
  }
  for (const id of htmlSceneIds) {
    if (!uniqueIds.has(id)) {
      errors.push(`index.html lists unknown scene id "${id}"`);
    }
  }

  return { tourDir, errors, sceneCount: scenes.length };
}

module.exports = {
  CUBE_FACES,
  VALID_MOUSE_VIEW_MODES,
  REQUIRED_VENDOR_FILES,
  REQUIRED_IMG_FILES,
  REQUIRED_HTML_ELEMENT_IDS,
  listTourDirectories,
  loadAppData,
  extractHtmlSceneIds,
  missingRequiredFiles,
  missingRequiredHtmlElementIds,
  settingsChromeMismatches,
  tilesPerSide,
  missingCubeTiles,
  reachableSceneIds,
  validateTourPackage
};
