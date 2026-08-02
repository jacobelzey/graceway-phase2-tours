'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  listTourDirectories,
  validateTourPackage,
  loadAppData
} = require('../lib/tour-integrity');

const REPO_ROOT = path.join(__dirname, '..');

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

describe('shared player script drift', () => {
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
  }
});

describe('validateTourPackage failure modes', () => {
  it('reports broken hotspot targets', () => {
    const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'tour-'));
    fs.writeFileSync(
      path.join(tmp, 'data.js'),
      `var APP_DATA = ${JSON.stringify({
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
        ],
        settings: { mouseViewMode: 'drag' }
      })};`
    );
    fs.writeFileSync(
      path.join(tmp, 'index.html'),
      '<a href="javascript:void(0)" class="scene" data-id="a"><li class="text">A</li></a>'
    );
    fs.writeFileSync(path.join(tmp, 'index.js'), '// stub');
    fs.mkdirSync(path.join(tmp, 'tiles', 'a'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'tiles', 'a', 'preview.jpg'), 'x');

    const result = validateTourPackage(tmp);
    assert.ok(
      result.errors.some((error) => error.includes('targets unknown scene "missing"')),
      result.errors.join('; ')
    );
  });
});
