'use strict';

/**
 * Pure helpers mirroring january-2026/index.js (shared across all tour months).
 * Kept separate so navigation/escaping behavior can be regression-tested without a browser.
 */

function sanitize(s) {
  return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
}

function findSceneById(scenes, id) {
  for (var i = 0; i < scenes.length; i++) {
    if (scenes[i].data.id === id) {
      return scenes[i];
    }
  }
  return null;
}

function findSceneDataById(sceneDataList, id) {
  for (var i = 0; i < sceneDataList.length; i++) {
    if (sceneDataList[i].id === id) {
      return sceneDataList[i];
    }
  }
  return null;
}

module.exports = {
  sanitize,
  findSceneById,
  findSceneDataById
};
