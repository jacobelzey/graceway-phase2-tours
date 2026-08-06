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
  extractScriptSrcs,
  extractStylesheetHrefs,
  bootResourceErrors,
  hasTitleBarSceneName,
  isCssAttributeSafeSceneId,
  missingRequiredFiles,
  missingRequiredHtmlElementIds,
  settingsChromeMismatches,
  tilesPerSide,
  missingCubeTiles,
  reachableSceneIds,
  REQUIRED_VENDOR_FILES,
  REQUIRED_IMG_FILES,
  REQUIRED_HTML_ELEMENT_IDS,
  REQUIRED_BOOT_SCRIPTS,
  REQUIRED_STYLESHEETS,
  CUBE_FACES
} = require('../lib/tour-integrity');

const REPO_ROOT = path.join(__dirname, '..');

function defaultShellHtml(sceneId = 'a') {
  return [
    '<link rel="stylesheet" href="vendor/reset.min.css">',
    '<link rel="stylesheet" href="style.css">',
    '<body class="multiple-scenes view-control-buttons">',
    '<div id="pano"></div>',
    '<div id="titleBar"><span class="sceneName"></span></div>',
    `<div id="sceneList"><a href="javascript:void(0)" class="scene" data-id="${sceneId}"><li class="text">A</li></a></div>`,
    '<a id="sceneListToggle"></a>',
    '<a id="autorotateToggle"></a>',
    '<a id="fullscreenToggle"></a>',
    '<a id="viewUp"></a><a id="viewDown"></a><a id="viewLeft"></a>',
    '<a id="viewRight"></a><a id="viewIn"></a><a id="viewOut"></a>',
    '<script src="vendor/screenfull.min.js"></script>',
    '<script src="vendor/bowser.min.js"></script>',
    '<script src="vendor/marzipano.js"></script>',
    '<script src="data.js"></script>',
    '<script src="index.js"></script>',
    '</body>'
  ].join('\n');
}

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
  fs.writeFileSync(path.join(tmp, 'index.html'), overrides.html || defaultShellHtml(scene.id));
  fs.writeFileSync(path.join(tmp, 'index.js'), '// stub');
  fs.writeFileSync(path.join(tmp, 'style.css'), '/* stub */');
  for (const relativePath of [...REQUIRED_VENDOR_FILES, ...REQUIRED_IMG_FILES]) {
    const fullPath = path.join(tmp, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, 'x');
  }
  fs.mkdirSync(path.join(tmp, 'tiles', scene.id), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'tiles', scene.id, 'preview.jpg'), 'x');
  // Minimal valid LOD grids so packaging tests do not trip cube-tile checks.
  for (const [z, level] of (scene.levels || []).entries()) {
    if (!level || level.fallbackOnly) continue;
    const side = Math.ceil(level.size / level.tileSize);
    for (const face of CUBE_FACES) {
      for (let y = 0; y < side; y += 1) {
        for (let x = 0; x < side; x += 1) {
          const dir = path.join(tmp, 'tiles', scene.id, String(z), face, String(y));
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, `${x}.jpg`), 'x');
        }
      }
    }
  }
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

  it('keeps vendor boot scripts byte-identical across all tours', () => {
    const tours = listTourDirectories(REPO_ROOT);
    for (const relativePath of REQUIRED_VENDOR_FILES) {
      const hashes = tours.map((tour) => {
        const bytes = fs.readFileSync(path.join(REPO_ROOT, tour, relativePath));
        return crypto.createHash('sha256').update(bytes).digest('hex');
      });
      assert.ok(
        hashes.every((hash) => hash === hashes[0]),
        `${relativePath} drifted across tours: ${JSON.stringify(Object.fromEntries(tours.map((t, i) => [t, hashes[i]])))}`
      );
    }
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

describe('HTML boot resource contract', () => {
  it('extracts script src and stylesheet href values', () => {
    const html = [
      '<link rel="stylesheet" href="vendor/reset.min.css">',
      '<link href="style.css" rel="stylesheet">',
      '<script src="vendor/marzipano.js"></script>',
      '<script src="data.js"></script>',
      '<script src="index.js"></script>'
    ].join('\n');
    assert.deepEqual(extractStylesheetHrefs(html), ['vendor/reset.min.css', 'style.css']);
    assert.deepEqual(extractScriptSrcs(html), ['vendor/marzipano.js', 'data.js', 'index.js']);
  });

  it('requires vendor/data scripts before index.js and stylesheets present', () => {
    assert.ok(REQUIRED_BOOT_SCRIPTS.includes('data.js'));
    assert.ok(REQUIRED_STYLESHEETS.includes('style.css'));

    const good = defaultShellHtml();
    assert.deepEqual(bootResourceErrors(good), []);

    const badOrder = good.replace(
      '<script src="data.js"></script>\n<script src="index.js"></script>',
      '<script src="index.js"></script>\n<script src="data.js"></script>'
    );
    assert.ok(bootResourceErrors(badOrder).some((error) => error.includes('data.js before index.js')));

    const missingMarzipano = good.replace('<script src="vendor/marzipano.js"></script>\n', '');
    assert.ok(
      bootResourceErrors(missingMarzipano).some((error) =>
        error.includes('missing boot script vendor/marzipano.js')
      )
    );
  });

  it('requires #titleBar .sceneName for updateSceneName', () => {
    assert.equal(hasTitleBarSceneName(defaultShellHtml()), true);
    assert.equal(hasTitleBarSceneName('<div id="titleBar"></div>'), false);
    assert.equal(hasTitleBarSceneName('<span class="sceneName"></span>'), false);
  });

  it('rejects scene ids that break CSS attribute selectors in index.js', () => {
    assert.equal(isCssAttributeSafeSceneId('0-lobby-entrance'), true);
    assert.equal(isCssAttributeSafeSceneId('bad id'), false);
    assert.equal(isCssAttributeSafeSceneId('quote"id'), false);
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
    assert.ok(mismatches.some((message) => message.includes('view-control-buttons')));
  });
});

describe('cube tile grid helpers', () => {
  it('computes tiles-per-side from Marzipano level size/tileSize', () => {
    assert.equal(tilesPerSide({ size: 512, tileSize: 512 }), 1);
    assert.equal(tilesPerSide({ size: 1024, tileSize: 512 }), 2);
    assert.equal(tilesPerSide({ size: 4096, tileSize: 512 }), 8);
    assert.equal(tilesPerSide({ size: 256, tileSize: 0 }), null);
  });

  it('reports missing face tiles for incomplete LODs', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tiles-'));
    const scene = {
      id: 'room',
      levels: [
        { tileSize: 256, size: 256, fallbackOnly: true },
        { tileSize: 512, size: 512 }
      ]
    };
    // Only create one face tile at z=1.
    fs.mkdirSync(path.join(tmp, 'tiles', 'room', '1', 'f', '0'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'tiles', 'room', '1', 'f', '0', '0.jpg'), 'x');

    const missing = missingCubeTiles(tmp, scene);
    assert.ok(missing.includes('room/1/b/0/0.jpg'));
    assert.equal(missing.includes('room/1/f/0/0.jpg'), false);
    // fallbackOnly level 0 is intentionally skipped.
    assert.equal(
      missing.some((entry) => entry.startsWith('room/0/')),
      false
    );
  });
});

describe('hotspot navigation graph', () => {
  it('returns scenes reachable by following link hotspot targets', () => {
    const scenes = [
      { id: 'a', linkHotspots: [{ target: 'b' }] },
      { id: 'b', linkHotspots: [{ target: 'c' }] },
      { id: 'c', linkHotspots: [] },
      { id: 'orphan', linkHotspots: [] }
    ];
    assert.deepEqual([...reachableSceneIds(scenes, 'a')].sort(), ['a', 'b', 'c']);
    assert.deepEqual([...reachableSceneIds(scenes, 'orphan')], ['orphan']);
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

    it(`${tour}: every scene is reachable via link hotspots from the start scene`, () => {
      const appData = loadAppData(path.join(REPO_ROOT, tour));
      const startId = appData.scenes[0].id;
      const reachable = reachableSceneIds(appData.scenes, startId);
      const unreachable = appData.scenes
        .map((scene) => scene.id)
        .filter((id) => !reachable.has(id));
      assert.deepEqual(
        unreachable,
        [],
        `${tour}: scenes unreachable from ${startId} via hotspots: ${unreachable.join(', ')}`
      );
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
      html: [
        '<link rel="stylesheet" href="vendor/reset.min.css">',
        '<link rel="stylesheet" href="style.css">',
        '<body class="multiple-scenes view-control-buttons">',
        '<div id="pano"></div><div id="sceneList"><a class="scene" data-id="a"></a></div>',
        '<script src="vendor/screenfull.min.js"></script>',
        '<script src="vendor/bowser.min.js"></script>',
        '<script src="vendor/marzipano.js"></script>',
        '<script src="data.js"></script>',
        '<script src="index.js"></script>',
        '</body>'
      ].join('\n')
    });

    const result = validateTourPackage(tmp);
    assert.ok(
      result.errors.some((error) => error.includes('missing required element id="titleBar"')),
      result.errors.join('; ')
    );
    assert.ok(
      result.errors.some((error) => error.includes('missing #titleBar .sceneName')),
      result.errors.join('; ')
    );
  });

  it('reports HTML scene list / data.js drift', () => {
    const tmp = writeMinimalTour(fs.mkdtempSync(path.join(os.tmpdir(), 'tour-')), {
      html: defaultShellHtml().replace('data-id="a"', 'data-id="not-a"')
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

  it('reports missing cube face tiles beyond preview.jpg', () => {
    const tmp = writeMinimalTour(fs.mkdtempSync(path.join(os.tmpdir(), 'tour-')));
    // Delete one face tile that preview-only checks would miss.
    fs.unlinkSync(path.join(tmp, 'tiles', 'a', '0', 'u', '0', '0.jpg'));

    const result = validateTourPackage(tmp);
    assert.ok(
      result.errors.some((error) => error.includes('missing cube tile a/0/u/0/0.jpg')),
      result.errors.join('; ')
    );
  });

  it('reports invalid mouseViewMode settings', () => {
    const tmp = writeMinimalTour(fs.mkdtempSync(path.join(os.tmpdir(), 'tour-')), {
      appData: { settings: { mouseViewMode: 'wasd', autorotateEnabled: true, fullscreenButton: true, viewControlButtons: true } }
    });

    const result = validateTourPackage(tmp);
    assert.ok(
      result.errors.some((error) => error.includes('mouseViewMode must be one of')),
      result.errors.join('; ')
    );
  });

  it('reports boot script order / missing stylesheet regressions', () => {
    const tmp = writeMinimalTour(fs.mkdtempSync(path.join(os.tmpdir(), 'tour-')), {
      html: defaultShellHtml()
        .replace('<link rel="stylesheet" href="style.css">\n', '')
        .replace(
          '<script src="data.js"></script>\n<script src="index.js"></script>',
          '<script src="index.js"></script>\n<script src="data.js"></script>'
        )
    });

    const result = validateTourPackage(tmp);
    assert.ok(
      result.errors.some((error) => error.includes('missing stylesheet style.css')),
      result.errors.join('; ')
    );
    assert.ok(
      result.errors.some((error) => error.includes('data.js before index.js')),
      result.errors.join('; ')
    );
  });

  it('reports CSS-unsafe scene ids that would break scene list querySelector', () => {
    const unsafeId = 'bad id';
    const tmp = writeMinimalTour(fs.mkdtempSync(path.join(os.tmpdir(), 'tour-')), {
      scene: { id: unsafeId },
      html: defaultShellHtml(unsafeId)
    });
    // Tile dirs use the unsafe id from scene override.
    fs.mkdirSync(path.join(tmp, 'tiles', unsafeId), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'tiles', unsafeId, 'preview.jpg'), 'x');
    fs.mkdirSync(path.join(tmp, 'tiles', unsafeId, '0', 'f', '0'), { recursive: true });
    for (const face of CUBE_FACES) {
      const dir = path.join(tmp, 'tiles', unsafeId, '0', face, '0');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, '0.jpg'), 'x');
    }

    const result = validateTourPackage(tmp);
    assert.ok(
      result.errors.some((error) => error.includes('unsafe for CSS attribute selectors')),
      result.errors.join('; ')
    );
  });

  it('reports missing body view-control-buttons class when settings enable controls', () => {
    const tmp = writeMinimalTour(fs.mkdtempSync(path.join(os.tmpdir(), 'tour-')), {
      html: defaultShellHtml().replace('multiple-scenes view-control-buttons', 'multiple-scenes')
    });

    const result = validateTourPackage(tmp);
    assert.ok(
      result.errors.some((error) => error.includes('lacks class view-control-buttons')),
      result.errors.join('; ')
    );
  });
});
