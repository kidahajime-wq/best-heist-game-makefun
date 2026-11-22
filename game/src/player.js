// The thief: movement, stance, loot weight, pickups and tools.
// One job: what the player does each step, and what it costs.

import {
  SPEEDS, WEIGHT_PENALTY_PER_UNIT, MIN_SPEED_FACTOR, PLAYER_RADIUS,
  VAULT_DOOR, EXIT_ZONE, TOOLS, DIAMOND_ALARM_JUMP,
} from './config.js';
import { moveVector, held, justPressed, clickedButton } from './input.js';
import { currentBlockers, moveCircle, lootNear, carriedTotals, toast, burst } from './level.js';
import { distance } from './vision.js';
import { sfx } from './audio.js';

/** Speed after the loot on the thief's back slows them down. */
export function currentSpeed(state) {
  const base = state.player.stance === 'sprint'
    ? SPEEDS.sprint
    : state.player.stance === 'crouch' ? SPEEDS.crouch : SPEEDS.walk;
  const factor = Math.max(MIN_SPEED_FACTOR, 1 - state.player.weight * WEIGHT_PENALTY_PER_UNIT);
  return base * factor;
}

/** Near the vault door (within reach of its keypad)? */
export function nearVaultDoor(player) {
  return distance(player.x, player.y, VAULT_DOOR.x + 8, VAULT_DOOR.y + 32) < 70;
}

/** Standing in the service exit? */
export function inExitZone(player) {
  return player.x > EXIT_ZONE.x - 6 && player.x < EXIT_ZONE.x + EXIT_ZONE.w + 6
    && player.y > EXIT_ZONE.y - 10 && player.y < EXIT_ZONE.y + EXIT_ZONE.h + 10;
}

/**
 * One step of the player. Returns 'escaped' when the thief slips out with the
 * diamond, 'denied-exit' when they reach the door empty-handed, else null.
 */
export function updatePlayer(state, input, dt) {
  const player = state.player;

  // Stance: sprint is loud and fast, crouch is quiet and slow.
  player.stance = held(input, 'sprint') ? 'sprint' : held(input, 'crouch') ? 'crouch' : 'walk';

  const vec = moveVector(input);
  const speed = currentSpeed(state);
  const blockers = currentBlockers(state);
  const moved = moveCircle(player.x, player.y, PLAYER_RADIUS, vec.x * speed * dt, vec.y * speed * dt, blockers);
  player.moving = vec.x !== 0 || vec.y !== 0;
  if (player.moving) {
    player.angle = Math.atan2(vec.y, vec.x);
    player.speed = speed;
    if (Math.random() < dt * 3 && player.stance === 'sprint') sfx.step();
  }
  player.x = moved.x;
  player.y = moved.y;

  // Walking over loot picks it up. The diamond trips the vault alarm.
  const item = lootNear(state, player.x, player.y);
  if (item) {
    item.taken = true;
    const totals = carriedTotals(state);
    player.value = totals.value;
    player.weight = totals.weight;
    state.stats.lootTaken += 1;
    burst(state, item.x, item.y, item.kind === 'diamond' ? '#bfe9ff' : '#ffd97a');
    if (item.kind === 'diamond') {
      state.diamondTaken = true;
      state.alarm = Math.min(100, state.alarm + DIAMOND_ALARM_JUMP);
      toast(state, 'THE STAR OF AURUM IS YOURS — the vault alarm just jumped!', 4);
      sfx.diamond();
    } else {
      toast(state, `+ $${item.value.toLocaleString('en-US')} — ${item.kind} stashed`, 2.5);
      sfx.pickup();
    }
  }

  // Power cut: Q (or the HUD button) blinds every camera for a few seconds.
  if ((justPressed(input, 'powerCut') || clickedButton(input) === 'power') && player.powerCuts > 0) {
    player.powerCuts -= 1;
    player.powerCutUntil = state.elapsed + TOOLS.powerCutSeconds;
    toast(state, `Power cut — cameras blind for ${TOOLS.powerCutSeconds}s`, 3);
    sfx.powerCut();
  } else if ((justPressed(input, 'powerCut') || clickedButton(input) === 'power') && player.powerCuts <= 0) {
    toast(state, 'No power cuts left', 2);
    sfx.denied();
  }

  // Insider: E by the vault door has Marcel open it from the inside.
  if ((justPressed(input, 'insider') || clickedButton(input) === 'insider')
    && !state.vaultDoorOpen && nearVaultDoor(player)) {
    if (player.insiderKeys > 0) {
      player.insiderKeys -= 1;
      state.vaultDoorOpen = true;
      toast(state, 'Marcel (the insider) just opened the vault door.', 3.5);
      burst(state, VAULT_DOOR.x + 8, VAULT_DOOR.y + 32, '#e8c15a', 20);
      sfx.door();
    } else {
      toast(state, 'The insider already used his one favour.', 2);
      sfx.denied();
    }
  }

  // The exit only counts with the diamond.
  if (inExitZone(player)) {
    if (state.diamondTaken) {
      state.escaped = true;
      return 'escaped';
    }
    if (!state._exitHintShown) {
      state._exitHintShown = true;
      toast(state, 'The service exit — but the Star of Aurum is still in the vault.', 4);
    }
  } else {
    state._exitHintShown = false;
  }
  return null;
}
