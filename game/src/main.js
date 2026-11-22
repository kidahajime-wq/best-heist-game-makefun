// Main loop: screens, the world step, and the shot mode for screenshots.
// One job: wire input, audio, the world and the renderer together.

import { WORLD } from './config.js';
import { freshState, toast, burst } from './level.js';
import { createInput, held, justPressed, endFrame } from './input.js';
import { render, CANVAS_W, CANVAS_H } from './render.js';
import { updateGuard, alarmStageIndex, nearestGuardDistance } from './guards.js';
import { updateCameras, cameraSees } from './cameras.js';
import { guardSees } from './guards.js';
import { updatePlayer } from './player.js';
import { applyDetection, announceStage, lockdownDrain, updateGuest } from './alarm.js';
import { ensureAudio, sfx, updateAlarmDrone, heartbeat, toggleMute, isMuted } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const input = createInput();

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const shotMode = shotName !== null;

let state = shotMode ? stageShot(shotName) : freshState();
let paused = false;
let lastStage = 0;
let lastHeartbeat = 0;
let lastTime = performance.now();
let statusText = '';

function setStatus(text) {
  if (text !== statusText) {
    statusText = text;
    statusEl.textContent = text;
  }
}

function startRun() {
  state = freshState();
  state.screen = 'play';
  paused = false;
  lastStage = 0;
  toast(state, 'You are in. The Star of Aurum waits in the vault, top right.', 4);
  sfx.click();
  setStatus('Heist started. Steal the Star of Aurum and reach the service exit.');
}

function endRun(won, reason) {
  state.screen = won ? 'escaped' : 'caught';
  state.endReason = reason;
  if (won) sfx.win();
  else sfx.caught();
  updateAlarmDrone(0);
  setStatus(won ? 'Clean getaway!' : `Busted: ${reason}`);
}

/** One fixed step of the world while the heist is running. */
function stepWorld(dt) {
  state.elapsed += dt;
  state.timeLeft -= dt + lockdownDrain(dt, alarmStageIndex(state.alarm));
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    endRun(false, 'The clock hit zero — the police sealed the casino.');
    return;
  }

  updateCameras(state);
  const playerResult = updatePlayer(state, input, dt);
  if (playerResult === 'escaped') {
    endRun(true, '');
    return;
  }

  // Detection: the strongest signal this frame drives the alarm.
  let bestSeen = 0;
  let bestRate = 0;
  for (const guard of state.guards) {
    const seen = guardSees(state, guard);
    if (seen > bestSeen) {
      bestSeen = seen;
      bestRate = 26;
    }
    const caught = updateGuard(state, guard, dt, alarmStageIndex(state.alarm));
    if (caught === 'caught') {
      endRun(false, `${guard.name} caught you in the open.`);
      return;
    }
  }
  for (const camera of state.cameras) {
    const seen = cameraSees(state, camera);
    if (seen > bestSeen) {
      bestSeen = seen;
      bestRate = 34;
    }
  }
  for (const guest of state.guests) {
    const rate = updateGuest(state, guest, dt);
    if (rate > 0 && rate > bestSeen * 26) {
      bestSeen = Math.min(1, rate / 26);
      bestRate = 26;
    }
  }
  const stage = applyDetection(state, bestSeen, bestRate, dt);
  if (stage !== lastStage) {
    announceStage(state, stage);
    lastStage = stage;
  }
  if (state.alarm >= 100) {
    endRun(false, 'Full lockdown — the vault sealed with you inside.');
    return;
  }

  // Near-catch heartbeat: a guard close by while the heat is on.
  const near = nearestGuardDistance(state);
  if (near < 110 && state.alarm >= 25 && state.elapsed - lastHeartbeat > 0.55) {
    heartbeat();
    lastHeartbeat = state.elapsed;
  }
  updateAlarmDrone(state.alarm);

  // Particles fade and drift.
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const pt = state.particles[i];
    pt.life -= dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    if (pt.life <= 0) state.particles.splice(i, 1);
  }
  for (let i = state.toasts.length - 1; i >= 0; i -= 1) {
    if (state.elapsed > state.toasts[i].until) state.toasts.splice(i, 1);
  }

  const mins = Math.max(0, Math.floor(state.timeLeft / 60));
  const secs = Math.max(0, Math.floor(state.timeLeft % 60));
  setStatus(
    `Alarm ${Math.round(state.alarm)}, ${mins}:${String(secs).padStart(2, '0')} left, `
    + `$${state.player.value.toLocaleString('en-US')} lifted.`,
  );
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  if (!shotMode) {
    ensureAudio();
    if (justPressed(input, 'mute')) {
      toggleMute();
      toast(state, isMuted() ? 'Sound muted (M to unmute).' : 'Sound on.', 2);
    }
    if (state.screen === 'title' && justPressed(input, 'confirm')) startRun();
    else if ((state.screen === 'caught' || state.screen === 'escaped') && justPressed(input, 'restart')) startRun();
    else if (state.screen === 'play' && justPressed(input, 'restart')) startRun();
    else if (state.screen === 'play' && justPressed(input, 'pause')) {
      paused = !paused;
      sfx.click();
    }

    if (state.screen === 'play' && !paused) stepWorld(dt);
    // The title screen's blink and the end screens keep their own clock.
    if (state.screen !== 'play') state.elapsed += dt;
  }

  render(ctx, state, input, dt, paused);
  endFrame(input);
  requestAnimationFrame(frame);
}

function resize() {
  const scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  canvas.style.width = `${Math.floor(CANVAS_W * scale)}px`;
  canvas.style.height = `${Math.floor(CANVAS_H * scale)}px`;
  void WORLD;
}
window.addEventListener('resize', resize);
resize();

// Keep the world still in shot mode: the staged tableau is the screenshot.
if (shotMode) {
  // One warm-up render so fonts and gradients settle before the capture.
  render(ctx, state, input, 0, false);
}
requestAnimationFrame(frame);
