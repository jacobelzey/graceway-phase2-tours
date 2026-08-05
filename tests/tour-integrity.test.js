'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const {
  listTourDirectories,
  validateTourPackage,
  loadAppData,
  extractHtmlSceneIds,
  tilesPerSide,
  missingCubeTiles,
  reachableSceneIds,
  CUBE_FACES
} = require('../lib/tour-integrity');

const REPO_ROOT = path.join(__dirname, '..');

function writeMinimalTour(tmp, overrides = {}) {
  const appData = {
    scenes: [
      {
        id: 'a',
        name: 'A',
        faceSize: 100,
        levels: [{ tileSize: 256, size: 256 }],
        initialViewParameters: { pitch: 0, yaw: 0, fov: 1.5 },
        linkHotspots: [{ yaw: 0, pitch: 0, rotation: 0, target: 'a' }],
        infoHotspots: []
      }
    ],
    settings: { mouseViewMode: 'drag' },
    ...overrides
  };
  fs.writeFileSync(path.join(tmp, 'data.js'), `var APP_DATA = ${JSON.stringify(appData)};`);
  fs.writeFileSync(
    path.join(tmp, 'index.html'),
    '<a href="javascript:void(0)" class="scene" data-id="a"><li class="text">A</li></a>'
  );
  fs.writeFileSync(path.join(tmp, 'index.js'), '// stub');
  fs.mkdirSync(path.join(tmp, 'tiles', 'a', '0', 'f', '0'), { recursive: true });
  // Minimal valid LOD grid for size/tileSize 256 (1x1) across all faces.
  for (const face of CUBE_FACES) {
    const dir = path.join(tmp, 'tiles', 'a', '0', face, '0');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, '0.jpg'), 'x');
  }
  fs.writeFileSync(path.join(tmp, 'tiles', 'a', 'preview.jpg'), 'x');
  return appData;
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
      '<a class="scene" data-id="first">First</a>',
      '<a data-id="second" class="scene active">Second</a>',
      '<a class="other" data-id="ignored">Nope</a>'
    ].join('\n');
    assert.deepEqual(extractHtmlSceneIds(html), ['first', 'second']);
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
    it(`${tour}: scenes, hotspots, HTML list, and tiles stay consistent`, () => {
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
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tour-'));
    writeMinimalTour(tmp, {
      scenes: [
        {
          id: 'a',
          name: 'A',
          faceSize: 100,
          levels: [{ tileSize: 256, size: 256 }],
          initialViewParameters: { pitch: 0, yaw: 0, fov: 1.5 },
          linkHotspots: [{ yaw: 0, pitch: 0, rotation: 0, target: 'missing' }],
          infoHotspots: []
        }
      ]
    });

    const result = validateTourPackage(tmp);
    assert.ok(
      result.errors.some((error) => error.includes('targets unknown scene "missing"')),
      result.errors.join('; ')
    );
  });

  it('reports missing cube face tiles beyond preview.jpg', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tour-'));
    writeMinimalTour(tmp);
    // Delete one face tile that preview-only checks would miss.
    fs.unlinkSync(path.join(tmp, 'tiles', 'a', '0', 'u', '0', '0.jpg'));

    const result = validateTourPackage(tmp);
    assert.ok(
      result.errors.some((error) => error.includes('missing cube tile a/0/u/0/0.jpg')),
      result.errors.join('; ')
    );
  });

  it('reports HTML scene list / data.js drift', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tour-'));
    writeMinimalTour(tmp);
    fs.writeFileSync(
      path.join(tmp, 'index.html'),
      '<a href="javascript:void(0)" data-id="a" class="scene"><li class="text">A</li></a>' +
        '<a href="javascript:void(0)" data-id="ghost" class="scene"><li class="text">Ghost</li></a>'
    );

    const result = validateTourPackage(tmp);
    assert.ok(
      result.errors.some((error) => error.includes('unknown scene id "ghost"')),
      result.errors.join('; ')
    );
  });

  it('reports invalid mouseViewMode settings', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tour-'));
    writeMinimalTour(tmp, {
      settings: { mouseViewMode: 'wasd' }
    });

    const result = validateTourPackage(tmp);
    assert.ok(
      result.errors.some((error) => error.includes('mouseViewMode must be one of')),
      result.errors.join('; ')
    );
  });
});
