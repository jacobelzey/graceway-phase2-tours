'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const {
  listTourDirectories,
  validateTourPackage,
  loadAppData,
  extractHtmlSceneIds,
  missingRequiredFiles,
  missingRequiredHtmlElementIds,
  settingsChromeMismatches,
  REQUIRED_VENDOR_FILES,
  REQUIRED_IMG_FILES,
  REQUIRED_HTML_ELEMENT_IDS
} = require('../lib/tour-integrity');

const REPO_ROOT = path.join(__dirname, '..');

function writeMinimalTour(tmp, overrides = {}) {
  const scene = {
    id: 'a',
    name: 'A',
    faceSize: 100,
    levels: [{ tileSize: 256, size: 256 }],
    initialViewParameters: { pitch: 0, yaw: 0, fov: 1.5 },
    linkHotspots: [],
    infoHotspots: [],
    ...(overrides.scene || {})
  };
  const appData = {
    scenes: [scene],
    settings: { mouseViewMode: 'drag', autorotateEnabled: true, fullscreenButton: true, viewControlButtons: true },
    ...(overrides.appData || {})
  };
  if (overrides.appData && overrides.appData.scenes) {
    appData.scenes = overrides.appData.scenes;
  }

  fs.writeFileSync(path.join(tmp, 'data.js'), `var APP_DATA = ${JSON.stringify(appData)};`);
  fs.writeFileSync(
    path.join(tmp, 'index.html'),
    overrides.html ||
      [
        '<div id="pano"></div>',
        '<div id="titleBar"><span class="sceneName"></span></div>',
        '<div id="sceneList"><a href="javascript:void(0)" class="scene" data-id="a"><li class="text">A</li></a></div>',
        '<a id="sceneListToggle"></a>',
        '<a id="autorotateToggle"></a>',
        '<a id="fullscreenToggle"></a>',
        '<a id="viewUp"></a><a id="viewDown"></a><a id="viewLeft"></a>',
        '<a id="viewRight"></a><a id="viewIn"></a><a id="viewOut"></a>'
      ].join('\n')
  );
  fs.writeFileSync(path.join(tmp, 'index.js'), '// stub');
  fs.writeFileSync(path.join(tmp, 'style.css'), '/* stub */');
  for (const relativePath of [...REQUIRED_VENDOR_FILES, ...REQUIRED_IMG_FILES]) {
    const fullPath = path.join(tmp, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, 'x');
  }
  fs.mkdirSync(path.join(tmp, 'tiles', scene.id), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'tiles', scene.id, 'preview.jpg'), 'x');
  return tmp;
}

describe('tour package discovery', () => {
  it('finds every month tour directory', () => {
    const tours = listTourDirectories(REPO_ROOT);
    assert.deepEqual(tours, [
      'february-2026',
      'january-2026',
      'june-2026',
      'march-2026',
      'may-2026'
    ]);
  });
});

describe('shared player asset drift', () => {
  it('keeps index.js byte-identical across all tours', () => {
    const tours = listTourDirectories(REPO_ROOT);
    const hashes = tours.map((tour) => {
      const bytes = fs.readFileSync(path.join(REPO_ROOT, tour, 'index.js'));
      return crypto.createHash('sha256').update(bytes).digest('hex');
    });
    assert.ok(
      hashes.every((hash) => hash === hashes[0]),
      `index.js drifted across tours: ${JSON.stringify(Object.fromEntries(tours.map((t, i) => [t, hashes[i]])))}`
    );
  });

  it('keeps style.css byte-identical across all tours', () => {
    const tours = listTourDirectories(REPO_ROOT);
    const hashes = tours.map((tour) => {
      const bytes = fs.readFileSync(path.join(REPO_ROOT, tour, 'style.css'));
      return crypto.createHash('sha256').update(bytes).digest('hex');
    });
    assert.ok(
      hashes.every((hash) => hash === hashes[0]),
      `style.css drifted across tours: ${JSON.stringify(Object.fromEntries(tours.map((t, i) => [t, hashes[i]])))}`
    );
  });
});

describe('HTML scene list parsing', () => {
  it('reads data-id regardless of attribute order', () => {
    const html = [
      '<a class="scene" data-id="first" href="#"></a>',
      '<a data-id="second" class="scene active" href="#"></a>',
      '<a href="#" class="other" data-id="ignored"></a>',
      "<a class='scene' data-id='third'></a>"
    ].join('\n');
    assert.deepEqual(extractHtmlSceneIds(html), ['first', 'second', 'third']);
  });
});

describe('required packaging assets', () => {
  it('lists every vendor and chrome image the player/HTML boot path needs', () => {
    assert.ok(REQUIRED_VENDOR_FILES.includes('vendor/marzipano.js'));
    assert.ok(REQUIRED_IMG_FILES.includes('img/link.png'));
    assert.ok(REQUIRED_HTML_ELEMENT_IDS.includes('pano'));
  });

  it('reports missing relative packaging files', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tour-assets-'));
    fs.mkdirSync(path.join(tmp, 'vendor'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'vendor', 'marzipano.js'), 'x');
    assert.deepEqual(
      missingRequiredFiles(tmp, ['vendor/marzipano.js', 'vendor/bowser.min.js']),
      ['vendor/bowser.min.js']
    );
  });

  it('detects missing player shell element ids', () => {
    assert.deepEqual(missingRequiredHtmlElementIds('<div id="pano"></div>'), [
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
    ]);
  });

  it('flags settings/chrome mismatches that leave index.js querying null nodes', () => {
    const mismatches = settingsChromeMismatches(
      { fullscreenButton: true, autorotateEnabled: true, viewControlButtons: true },
      '<div id="pano"></div>'
    );
    assert.ok(mismatches.some((message) => message.includes('#fullscreenToggle')));
    assert.ok(mismatches.some((message) => message.includes('#viewUp')));
  });
});

describe('tour data integrity', () => {
  for (const tour of listTourDirectories(REPO_ROOT)) {
    it(`${tour}: scenes, hotspots, HTML list, tiles, and packaging stay consistent`, () => {
      const result = validateTourPackage(path.join(REPO_ROOT, tour));
      assert.deepEqual(
        result.errors,
        [],
        `${tour} integrity errors:\n- ${result.errors.join('\n- ')}`
      );
      assert.ok(result.sceneCount > 0);
    });

    it(`${tour}: every link hotspot resolves for tooltip/navigation`, () => {
      const appData = loadAppData(path.join(REPO_ROOT, tour));
      const ids = new Set(appData.scenes.map((scene) => scene.id));
      for (const scene of appData.scenes) {
        for (const hotspot of scene.linkHotspots) {
          assert.ok(
            ids.has(hotspot.target),
            `${tour}: ${scene.id} -> ${hotspot.target} must exist (findSceneDataById would return null)`
          );
        }
      }
    });

    it(`${tour}: ships required vendor scripts and hotspot/control icons`, () => {
      const tourDir = path.join(REPO_ROOT, tour);
      assert.deepEqual(missingRequiredFiles(tourDir, REQUIRED_VENDOR_FILES), []);
      assert.deepEqual(missingRequiredFiles(tourDir, REQUIRED_IMG_FILES), []);
    });
  }
});

describe('validateTourPackage failure modes', () => {
  it('reports broken hotspot targets', () => {
    const tmp = writeMinimalTour(fs.mkdtempSync(path.join(os.tmpdir(), 'tour-')), {
      scene: {
        linkHotspots: [{ yaw: 0, pitch: 0, rotation: 0, target: 'missing' }]
      }
    });

    const result = validateTourPackage(tmp);
    assert.ok(
      result.errors.some((error) => error.includes('targets unknown scene "missing"')),
      result.errors.join('; ')
    );
  });

  it('reports missing vendor and img packaging assets', () => {
    const tmp = writeMinimalTour(fs.mkdtempSync(path.join(os.tmpdir(), 'tour-')));
    fs.unlinkSync(path.join(tmp, 'vendor', 'marzipano.js'));
    fs.unlinkSync(path.join(tmp, 'img', 'link.png'));

    const result = validateTourPackage(tmp);
    assert.ok(
      result.errors.some((error) => error.includes('missing required vendor asset: vendor/marzipano.js')),
      result.errors.join('; ')
    );
    assert.ok(
      result.errors.some((error) => error.includes('missing required img asset: img/link.png')),
      result.errors.join('; ')
    );
  });

  it('reports missing player shell element ids', () => {
    const tmp = writeMinimalTour(fs.mkdtempSync(path.join(os.tmpdir(), 'tour-')), {
      html: '<div id="pano"></div><div id="sceneList"><a class="scene" data-id="a"></a></div>'
    });

    const result = validateTourPackage(tmp);
    assert.ok(
      result.errors.some((error) => error.includes('missing required element id="titleBar"')),
      result.errors.join('; ')
    );
  });

  it('reports HTML scene list / data.js drift', () => {
    const tmp = writeMinimalTour(fs.mkdtempSync(path.join(os.tmpdir(), 'tour-')), {
      html: [
        '<div id="pano"></div>',
        '<div id="titleBar"></div>',
        '<div id="sceneList"><a class="scene" data-id="not-a"></a></div>',
        '<a id="sceneListToggle"></a><a id="autorotateToggle"></a><a id="fullscreenToggle"></a>',
        '<a id="viewUp"></a><a id="viewDown"></a><a id="viewLeft"></a>',
        '<a id="viewRight"></a><a id="viewIn"></a><a id="viewOut"></a>'
      ].join('\n')
    });

    const result = validateTourPackage(tmp);
    assert.ok(
      result.errors.some((error) => error.includes('missing scene list entry for "a"')),
      result.errors.join('; ')
    );
    assert.ok(
      result.errors.some((error) => error.includes('lists unknown scene id "not-a"')),
      result.errors.join('; ')
    );
  });
});
