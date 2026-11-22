// Level state: builds a fresh heist from the config and owns collision.
// One job: the world as data — walls, loot, guards, cameras, guests — and
// the circle-vs-rectangle movement that every walker uses.

import {
  WALLS, VAULT_DOOR, FURNITURE, LOOT_DEFS, GUARD_DEFS, CAMERA_DEFS,
  GUEST_DEFS, ENTRY, TOOLS, TIMER_SECONDS,
} from './config.js';

/** All rectangles that block sight and movement, vault door included while shut. */
export function currentBlockers(state) {
  const blockers = [...WALLS, ...FURNITURE];
  if (!state.vaultDoorOpen) blockers.push(VAULT_DOOR);
  return blockers;
}

/** Fresh state for a new run. */
export function freshState() {
  return {
    screen: 'title',
    elapsed: 0,
    timeLeft: TIMER_SECONDS,
    alarm: 0,
    lastSeen: null,
    vaultDoorOpen: false,
    diamondTaken: false,
    escaped: false,
    stats: { timesSpotted: 0, peakAlarm: 0, lootTaken: 0 },
    player: {
      x: ENTRY.x, y: ENTRY.y, angle: -Math.PI / 2, stance: 'walk',
      moving: false, speed: 0, weight: 0, value: 0,
      powerCuts: TOOLS.powerCutCharges, insiderKeys: TOOLS.insiderCharges,
      powerCutUntil: -1,
    },
    guards: GUARD_DEFS.map((def, i) => ({
      name: def.name, colour: def.colour, waypoints: def.waypoints,
      x: def.waypoints[0][0], y: def.waypoints[0][1],
      angle: 0, waypointIndex: 1, mode: 'patrol',
      speed: def.speed, range: def.range, halfAngle: def.halfAngle,
      suspicion: 0, searchUntil: 0, pauseUntil: 0, id: i,
    })),
    cameras: CAMERA_DEFS.map((def) => ({
      x: def.x, y: def.y, baseAngle: def.baseAngle, amplitude: def.amplitude,
      period: def.period, range: def.range, angle: def.baseAngle,
    })),
    guests: GUEST_DEFS.map((def, i) => ({
      x: def.x, y: def.y, angle: Math.random() * Math.PI * 2,
      targetX: def.x, targetY: def.y, waitUntil: 0, area: def.area,
      alarmed: 0, id: i,
    })),
    loot: LOOT_DEFS.map((def) => ({ ...def, taken: false })),
    particles: [],
    toasts: [],
    heartbeat: 0,
    endReason: '',
  };
}

/** Move a circle (x, y, r) by (dx, dy), sliding along blockers. Returns the new position. */
export function moveCircle(x, y, r, dx, dy, blockers) {
  const tryMove = (nx, ny) => {
    for (let i = 0; i < blockers.length; i += 1) {
      const b = blockers[i];
      const cx = Math.max(b.x, Math.min(nx, b.x + b.w));
      const cy = Math.max(b.y, Math.min(ny, b.y + b.h));
      if ((nx - cx) ** 2 + (ny - cy) ** 2 < r * r) return false;
    }
    return true;
  };
  let nx = x;
  let ny = y;
  if (tryMove(x + dx, y)) nx = x + dx;
  if (tryMove(nx, y + dy)) ny = y + dy;
  return { x: nx, y: ny };
}

/** The nearest loot within pickup reach of (x, y), or null. */
export function lootNear(state, x, y, reach = 40) {
  for (const item of state.loot) {
    if (!item.taken && Math.hypot(item.x - x, item.y - y) < reach) return item;
  }
  return null;
}

/** Total loot value carried, and its weight. */
export function carriedTotals(state) {
  let value = 0;
  let weight = 0;
  for (const item of state.loot) {
    if (item.taken) {
      value += item.value;
      weight += item.weight;
    }
  }
  return { value, weight };
}

/** Push a toast line (HUD narration) that fades after a few seconds. */
export function toast(state, text, seconds = 3.5) {
  state.toasts.push({ text, until: state.elapsed + seconds });
  if (state.toasts.length > 3) state.toasts.shift();
}

/** Spawn a burst of sparkle particles at (x, y). */
export function burst(state, x, y, colour, count = 14) {
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 90;
    state.particles.push({
      x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      life: 0.5 + Math.random() * 0.4, maxLife: 0.9, colour, size: 2 + Math.random() * 3,
    });
  }
}
