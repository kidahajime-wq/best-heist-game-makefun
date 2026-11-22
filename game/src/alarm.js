// Alarm and guests: how the heat rises, and the gala crowd that notices.
// One job: the alarm meter, its stages, and the guests who spot a sprinting thief.

import { ALARM_STAGES, ALARM_DECAY_PER_SEC, DETECTION, LOCKDOWN_TIMER_DRAIN } from './config.js';
import { distance } from './vision.js';
import { moveCircle, currentBlockers, toast } from './level.js';
import { sfx } from './audio.js';

/** Stage of the alarm: 0 calm, 1 suspicious, 2 alert, 3 lockdown. */
export function alarmStage(alarm) {
  for (let i = 0; i < ALARM_STAGES.length; i += 1) {
    if (alarm < ALARM_STAGES[i].max) return i;
  }
  return ALARM_STAGES.length - 1;
}

export function alarmStageInfo(alarm) {
  return ALARM_STAGES[alarmStage(alarm)];
}

/**
 * Fold this frame's detection into the alarm. `seen` is the strongest
 * detection signal this frame (0 to 1) and `rate` its per-second weight.
 * Returns the new stage, so the caller can announce a change.
 */
export function applyDetection(state, seen, rate, dt) {
  if (seen > 0) {
    state.alarm = Math.min(100, state.alarm + seen * rate * dt);
  } else {
    state.alarm = Math.max(0, state.alarm - ALARM_DECAY_PER_SEC * dt);
  }
  state.stats.peakAlarm = Math.max(state.stats.peakAlarm, state.alarm);
  return alarmStage(state.alarm);
}

/** Announce a stage change once, with a toast and a sound. */
export function announceStage(state, stage) {
  const label = ALARM_STAGES[stage].label;
  if (stage === 1) {
    toast(state, 'Suspicious — the guards are watching closer.', 3);
    sfx.spotted();
  } else if (stage === 2) {
    toast(state, 'ALERT — guards are converging on your last seen spot!', 3.5);
    sfx.spotted();
  } else if (stage === 3) {
    toast(state, 'LOCKDOWN — the clock is draining twice as fast!', 4);
    sfx.spotted();
  }
  return label;
}

/** Extra seconds the timer loses while the alarm is at lockdown. */
export function lockdownDrain(dt, stage) {
  return stage === 3 ? dt * (LOCKDOWN_TIMER_DRAIN - 1) : 0;
}

/** One guest's step: wander the gala floor, notice a sprinting thief nearby. */
export function updateGuest(state, guest, dt) {
  const player = state.player;
  const dist = distance(guest.x, guest.y, player.x, player.y);

  // A sprinting thief within earshot makes a guest stare — and the alarm creeps.
  if (player.stance === 'sprint' && player.moving && dist < 110) {
    guest.alarmed = Math.min(1, guest.alarmed + dt * 1.5);
    return DETECTION.guestRate * (1 - dist / 140);
  }
  guest.alarmed = Math.max(0, guest.alarmed - dt * 0.4);

  // Wander: pick a new spot in the gala hall when the old one is reached.
  if (state.elapsed >= guest.waitUntil) {
    if (distance(guest.x, guest.y, guest.targetX, guest.targetY) < 8) {
      guest.targetX = guest.area.x + Math.random() * guest.area.w;
      guest.targetY = guest.area.y + Math.random() * guest.area.h;
      guest.waitUntil = state.elapsed + 1 + Math.random() * 2;
    } else {
      const step = 26 * dt;
      const dx = guest.targetX - guest.x;
      const dy = guest.targetY - guest.y;
      const len = Math.hypot(dx, dy);
      const moved = moveCircle(
        guest.x, guest.y, 11, (dx / len) * step, (dy / len) * step, currentBlockers(state),
      );
      guest.x = moved.x;
      guest.y = moved.y;
      guest.angle = Math.atan2(dy, dx);
    }
  }
  return 0;
}
