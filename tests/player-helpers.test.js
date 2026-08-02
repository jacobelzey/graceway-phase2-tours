'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
  sanitize,
  findSceneById,
  findSceneDataById
} = require('../lib/player-helpers');

describe('sanitize', () => {
  it('escapes the first ampersand, less-than, and greater-than (matches player behavior)', () => {
    assert.equal(sanitize('A & B < C > D'), 'A &amp; B &lt; C &gt; D');
  });

  it('leaves plain scene names unchanged', () => {
    assert.equal(sanitize('Auditorium entrance'), 'Auditorium entrance');
  });

  it('only replaces the first occurrence of each character, matching index.js', () => {
    // Intentionally documents current Marzipano-generated behavior.
    assert.equal(sanitize('a < b < c'), 'a &lt; b < c');
    assert.equal(sanitize('x & y & z'), 'x &amp; y & z');
  });
});

describe('findSceneDataById', () => {
  const scenes = [
    { id: 'lobby', name: 'Lobby' },
    { id: 'stage', name: 'Stage' }
  ];

  it('returns the matching scene data', () => {
    assert.deepEqual(findSceneDataById(scenes, 'stage'), { id: 'stage', name: 'Stage' });
  });

  it('returns null for unknown ids (callers must not dereference .name)', () => {
    assert.equal(findSceneDataById(scenes, 'missing'), null);
  });
});

describe('findSceneById', () => {
  const scenes = [
    { data: { id: 'lobby' }, scene: { id: 1 } },
    { data: { id: 'stage' }, scene: { id: 2 } }
  ];

  it('returns the wrapped scene object used by switchScene', () => {
    assert.equal(findSceneById(scenes, 'lobby'), scenes[0]);
  });

  it('returns null when a hotspot target is broken', () => {
    assert.equal(findSceneById(scenes, 'nope'), null);
  });
});

describe('player helper parity with shared index.js', () => {
  it('keeps sanitize body identical to the generated player', () => {
    const indexJs = fs.readFileSync(path.join(__dirname, '..', 'january-2026', 'index.js'), 'utf8');
    const match = indexJs.match(
      /function sanitize\(s\) \{\s*return (s\.replace\('&', '&amp;'\)\.replace\('<', '&lt;'\)\.replace\('>', '&gt;'\));/
    );
    assert.ok(match, 'expected sanitize function in index.js');
    const fromPlayer = match[1];
    assert.equal(
      sanitize.toString().includes(fromPlayer),
      true,
      'lib sanitize expression should match player sanitize expression'
    );
  });
});
