// Screenshot scenes: deterministic tableaus of the real game behind ?shot=.
// One job: stage a fresh world into the named moment, so the screenshots are
// honest renders of the same code the player runs.

import { freshState, carriedTotals } from './level.js';

/** Place the thief mid-room, a guard's cone on them, and the alarm raised. */
function stagePlay(state) {
  state.screen = 'play';
  state.elapsed = 48;
  state.timeLeft = 192;
  state.alarm = 32;
  state.player.x = 300;
  state.player.y = 340;
  state.player.angle = 0.2;
  // One chip stack already lifted, the corridor door ahead.
  const chip = state.loot.find((item) => item.id === 'chip1');
  chip.taken = true;
  const totals = carriedTotals(state);
  state.player.value = totals.value;
  state.player.weight = totals.weight;
  // Rook's cone sweeps across the thief's path.
  state.guards[0].x = 430;
  state.guards[0].y = 280;
  state.guards[0].angle = 2.9;
  state.guards[0].suspicion = 0.55;
  state.guards[1].x = 668;
  state.guards[1].y = 470;
  state.guards[1].angle = Math.PI / 2;
  state.guards[2].x = 900;
  state.guards[2].y = 420;
  state.guards[2].angle = Math.PI;
  state.guards[3].x = 950;
  state.guards[3].y = 130;
  state.guards[3].angle = -Math.PI / 2;
  state.toasts.push({ text: 'Suspicious — the guards are watching closer.', until: 9999 });
  state.lastSeen = { x: 300, y: 340, t: 47 };
}

/** The vault, moments after the diamond changed hands. */
function stageVault(state) {
  state.screen = 'play';
  state.elapsed = 133;
  state.timeLeft = 107;
  state.alarm = 58;
  state.vaultDoorOpen = true;
  state.player.x = 1140;
  state.player.y = 505;
  state.player.angle = -Math.PI / 2;
  // Fresh sparkles where the diamond just left its pedestal.
  for (let i = 0; i < 16; i += 1) {
    const a = Math.random() * Math.PI * 2;
    state.particles.push({
      x: 1140 + Math.cos(a) * 22, y: 440 + Math.sin(a) * 22,
      vx: 0, vy: 0, life: 0.9, maxLife: 0.9, colour: '#bfe9ff', size: 3,
    });
  }
  for (const id of ['diamond', 'gold1', 'gold2']) {
    state.loot.find((item) => item.id === id).taken = true;
  }
  const totals = carriedTotals(state);
  state.player.value = totals.value;
  state.player.weight = totals.weight;
  state.diamondTaken = true;
  state.stats.peakAlarm = 58;
  state.guards[2].x = 940;
  state.guards[2].y = 460;
  state.guards[2].angle = 0.15;
  state.guards[2].mode = 'chase';
  state.guards[2].suspicion = 1;
  state.guards[3].x = 900;
  state.guards[3].y = 320;
  state.guards[3].angle = Math.PI / 2;
  state.lastSeen = { x: 1140, y: 540, t: 132 };
  state.toasts.push({ text: 'THE STAR OF AURUM IS YOURS — the vault alarm just jumped!', until: 9999 });
}

/** The getaway: heavy with gold, alarm high, a guard closing in behind. */
function stageEscape(state) {
  state.screen = 'play';
  state.elapsed = 182;
  state.timeLeft = 58;
  state.alarm = 71;
  state.vaultDoorOpen = true;
  state.player.x = 980;
  state.player.y = 720;
  state.player.angle = 0.1;
  for (const id of ['diamond', 'gold1', 'gold2', 'gold3', 'chip1', 'chip2']) {
    state.loot.find((item) => item.id === id).taken = true;
  }
  const totals = carriedTotals(state);
  state.player.value = totals.value;
  state.player.weight = totals.weight;
  state.diamondTaken = true;
  state.stats.peakAlarm = 71;
  state.guards[1].x = 860;
  state.guards[1].y = 700;
  state.guards[1].angle = 0;
  state.guards[1].mode = 'chase';
  state.guards[1].suspicion = 1;
  state.guards[2].x = 900;
  state.guards[2].y = 620;
  state.guards[2].angle = Math.PI / 2;
  state.lastSeen = { x: 980, y: 720, t: 181 };
  state.toasts.push({ text: 'Diamond secured — reach the green EXIT, bottom right.', until: 9999 });
}

/**
 * Stage the named scene on a fresh world and return it.
 * Unknown names stage the title screen.
 */
export function stageShot(name) {
  const state = freshState();
  if (name === 'play') stagePlay(state);
  else if (name === 'vault') stageVault(state);
  else if (name === 'escape') stageEscape(state);
  else {
    state.screen = 'title';
    state.elapsed = 5;
  }
  return state;
}
