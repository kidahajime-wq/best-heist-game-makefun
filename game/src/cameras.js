// Cameras: wall-mounted, sweeping, and blind while the power is cut.
// One job: where each camera looks right now, and how hard it sees the thief.

import { DETECTION } from './config.js';
import { coneFactor, distance, hasLineOfSight } from './vision.js';
import { currentBlockers } from './level.js';

/** Current sweep angle of a camera at this moment in the run. */
export function cameraAngle(camera, elapsed) {
  const phase = (elapsed / camera.period) * Math.PI * 2;
  return camera.baseAngle + Math.sin(phase) * camera.amplitude;
}

/** True while the thief's power cut holds. */
export function cameraDisabled(state, camera) {
  return state.elapsed < state.player.powerCutUntil;
}

/** How strongly this camera sees the player right now: 0 (blind) to 1. */
export function cameraSees(state, camera) {
  if (cameraDisabled(state, camera)) return 0;
  const player = state.player;
  const dist = distance(camera.x, camera.y, player.x, player.y);
  if (dist > camera.range) return 0;
  const angle = cameraAngle(camera, state.elapsed);
  const factor = coneFactor(camera.x, camera.y, angle, 0.38, player.x, player.y);
  if (factor === 0) return 0;
  if (!hasLineOfSight(camera.x, camera.y, player.x, player.y, currentBlockers(state))) return 0;
  const falloff = 1 - (dist / camera.range) * 0.55;
  const stance = player.stance === 'crouch'
    ? DETECTION.crouchMultiplier
    : player.stance === 'sprint' ? DETECTION.sprintMultiplier : DETECTION.standMultiplier;
  return factor * falloff * stance;
}

/** Step every camera's angle so the renderer and the logic agree. */
export function updateCameras(state) {
  for (const camera of state.cameras) {
    camera.angle = cameraAngle(camera, state.elapsed);
  }
}
