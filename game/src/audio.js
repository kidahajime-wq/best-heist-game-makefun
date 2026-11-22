// Sound: every effect is synthesised with WebAudio, no audio files.
// One job: small named sounds plus the alarm drone and the near-catch heartbeat.

let ctx = null;
let muted = false;
let alarmNodes = null;

/** Create the audio context on the first user gesture; safe to call any time. */
export function ensureAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  if (muted) stopAlarmDrone();
  return muted;
}

function tone(freq, dur, type = 'sine', gain = 0.12, when = 0, slideTo = null) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  amp.gain.setValueAtTime(0, t0);
  amp.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, gain = 0.1, filterFreq = 1200) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime;
  const len = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const amp = ctx.createGain();
  amp.gain.value = gain;
  src.connect(filter);
  filter.connect(amp);
  amp.connect(ctx.destination);
  src.start(t0);
}

export const sfx = {
  pickup() {
    tone(880, 0.09, 'sine', 0.1);
    tone(1318, 0.14, 'sine', 0.1, 0.07);
  },
  diamond() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, i * 0.08));
  },
  door() {
    noiseBurst(0.25, 0.12, 500);
    tone(180, 0.25, 'triangle', 0.08, 0, 90);
  },
  powerCut() {
    tone(1200, 0.4, 'sawtooth', 0.06, 0, 120);
    noiseBurst(0.3, 0.08, 2400);
  },
  spotted() {
    tone(660, 0.12, 'square', 0.07);
    tone(660, 0.12, 'square', 0.07, 0.16);
  },
  caught() {
    [392, 311, 233].forEach((f, i) => tone(f, 0.3, 'sawtooth', 0.1, i * 0.18));
  },
  win() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.35, 'triangle', 0.12, i * 0.1));
  },
  click() {
    tone(700, 0.05, 'sine', 0.08);
  },
  denied() {
    tone(220, 0.12, 'square', 0.06, 0, 160);
  },
  step() {
    noiseBurst(0.05, 0.03, 800);
  },
};

/** A low pulsing drone while the alarm is raised; call every frame with the level. */
export function updateAlarmDrone(alarm) {
  if (!ctx || muted) {
    stopAlarmDrone();
    return;
  }
  if (alarm < 25) {
    stopAlarmDrone();
    return;
  }
  if (!alarmNodes) {
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const amp = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 55;
    lfo.type = 'sine';
    lfo.frequency.value = 1.1;
    lfoGain.gain.value = 18;
    amp.gain.value = 0.0;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start();
    lfo.start();
    alarmNodes = { osc, lfo, amp };
  }
  const target = alarm < 50 ? 0.015 : alarm < 75 ? 0.03 : 0.05;
  alarmNodes.amp.gain.setTargetAtTime(target, ctx.currentTime, 0.2);
}

export function stopAlarmDrone() {
  if (!alarmNodes) return;
  try {
    alarmNodes.osc.stop();
    alarmNodes.lfo.stop();
  } catch {
    // Already stopped.
  }
  alarmNodes = null;
}

/** Two low thumps, the near-catch heartbeat. */
export function heartbeat() {
  if (!ctx || muted) return;
  tone(55, 0.16, 'sine', 0.22);
  tone(48, 0.14, 'sine', 0.18, 0.16);
}
