// Guards: patrol, suspicion, chase and search.
// One job: the men in navy — how they walk their beat, notice the thief,
// give chase to the last seen spot, and calm down again.

import { DETECTION, SPEEDS } from './config.js';
import { angleTo, angleDiff, coneFactor, distance, hasLineOfSight } from './vision.js';
import { currentBlockers, moveCircle } from './level.js';

const CATCH_RADIUS = 24;
const SEARCH_SECONDS = 6;
const PATROL_PAUSE = 1.2;

/** How strongly this guard sees the player right now: 0 (blind) to 1 (dead on). */
export function guardSees(state, guard) {
  const player = state.player;
  const dist = distance(guard.x, guard.y, player.x, player.y);
  if (dist > guard.range) return 0;
  const factor = coneFactor(guard.x, guard.y, guard.angle, guard.halfAngle, player.x, player.y);
  if (factor === 0) return 0;
  if (!hasLineOfSight(guard.x, guard.y, player.x, player.y, currentBlockers(state))) return 0;
  const falloff = 1 - (dist / guard.range) * 0.6;
  const stance = player.stance === 'crouch'
    ? DETECTION.crouchMultiplier
    : player.stance === 'sprint' ? DETECTION.sprintMultiplier : DETECTION.standMultiplier;
  return factor * falloff * stance;
}

function turnToward(guard, targetAngle, dt, turnRate = 3.2) {
  let d = targetAngle - guard.angle;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  const step = Math.max(-turnRate * dt, Math.min(turnRate * dt, d));
  guard.angle += step;
}

function walkToward(state, guard, tx, ty, speed, dt) {
  const dist = distance(guard.x, guard.y, tx, ty);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + ((tx - guard.x) / dist) * step;
  const ny = guard.y + ((ty - guard.y) / dist) * step;
  const moved = moveCircle(guard.x, guard.y, 13, nx - guard.x, ny - guard.y, currentBlockers(state));
  guard.x = moved.x;
  guard.y = moved.y;
  turnToward(guard, angleTo(guard.x, guard.y, tx, ty), dt);
  return dist <= step + 1;
}

/** One guard's step. Returns 'caught' when the guard lays hands on the thief. */
export function updateGuard(state, guard, dt, alarmStage) {
  const player = state.player;
  const seen = guardSees(state, guard);
  const blockers = currentBlockers(state);

  // Seeing the thief builds suspicion; a full bar means a chase.
  if (seen > 0) {
    const before = guard.suspicion;
    guard.suspicion = Math.min(1, guard.suspicion + seen * dt * 1.4);
    if (guard.suspicion >= 1 && before < 1) {
      guard.mode = 'chase';
      state.lastSeen = { x: player.x, y: player.y, t: state.elapsed };
      state.stats.timesSpotted += 1;
    }
    if (seen > 0.45) state.lastSeen = { x: player.x, y: player.y, t: state.elapsed };
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - dt * 0.25);
  }

  const stageBoost = alarmStage >= 3 ? 1.45 : alarmStage >= 2 ? 1.3 : alarmStage >= 1 ? 1.15 : 1;
  const speed = guard.speed * stageBoost;

  if (guard.mode === 'chase' && state.lastSeen) {
    const arrived = walkToward(state, guard, state.lastSeen.x, state.lastSeen.y, speed * 1.7, dt);
    // Lose the trail: search the spot, then give up and go back on patrol.
    if (arrived || state.elapsed - state.lastSeen.t > 4) {
      guard.mode = 'search';
      guard.searchUntil = state.elapsed + SEARCH_SECONDS;
    }
    if (distance(guard.x, guard.y, player.x, player.y) < CATCH_RADIUS
      && hasLineOfSight(guard.x, guard.y, player.x, player.y, blockers)) {
      return 'caught';
    }
  } else if (guard.mode === 'search') {
    guard.angle += dt * 1.6; // scan the room
    if (state.elapsed >= guard.searchUntil) {
      guard.mode = 'patrol';
      guard.suspicion = 0;
    }
    if (distance(guard.x, guard.y, player.x, player.y) < CATCH_RADIUS) return 'caught';
  } else {
    // Patrol: walk the beat, pausing at each waypoint to look around.
    if (state.elapsed < guard.pauseUntil) {
      guard.angle += dt * 0.9;
    } else {
      const wp = guard.waypoints[guard.waypointIndex];
      const arrived = walkToward(state, guard, wp[0], wp[1], speed, dt);
      if (arrived) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
        guard.pauseUntil = state.elapsed + PATROL_PAUSE;
      }
    }
    if (distance(guard.x, guard.y, player.x, player.y) < CATCH_RADIUS) return 'caught';
  }
  return null;
}

/** Alarm stage index from the alarm level (0 calm … 3 lockdown). */
export function alarmStageIndex(alarm) {
  if (alarm >= 75) return 3;
  if (alarm >= 50) return 2;
  if (alarm >= 25) return 1;
  return 0;
}

/** The closest guard's distance to the player, for the near-catch heartbeat. */
export function nearestGuardDistance(state) {
  let best = Infinity;
  for (const guard of state.guards) {
    best = Math.min(best, distance(guard.x, guard.y, state.player.x, state.player.y));
  }
  return best;
}
